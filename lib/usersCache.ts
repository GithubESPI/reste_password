import axios from 'axios';
import { getGraphAccessToken } from './graphToken';

export interface DirectoryUser {
  id: string;
  displayName?: string;
  mail?: string;
  otherMails?: string[];
  jobTitle?: string;
  department?: string;
  companyName?: string;
  employeeType?: string;
  createdDateTime?: string;
  signInActivity?: {
    lastSignInDateTime?: string;
    lastNonInteractiveSignInDateTime?: string;
    lastSignInRequestId?: string;
  };
}

interface UsersCache {
  data: DirectoryUser[];
  timestamp: number;
}

// Cache en mémoire serveur (RAM)
let memoryCache: UsersCache | null = null;
let inFlightFetchPromise: Promise<DirectoryUser[]> | null = null;

// Durée de validité du cache en millisecondes (10 minutes par défaut)
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Récupère la liste des utilisateurs depuis le cache mémoire serveur
 * ou interroge Microsoft Graph API de manière optimisée.
 * Évite les requêtes en boucle redondantes et supprime les 15-30s de latence.
 */
export async function getCachedUsers(forceRefresh: boolean = false): Promise<{ users: DirectoryUser[]; fromCache: boolean; lastUpdated: number }> {
  const now = Date.now();

  // 1. Si le cache est valide et qu'on ne force pas le rafraîchissement
  if (!forceRefresh && memoryCache && (now - memoryCache.timestamp < CACHE_TTL_MS)) {
    return {
      users: memoryCache.data,
      fromCache: true,
      lastUpdated: memoryCache.timestamp,
    };
  }

  // 2. Si un fetch est déjà en cours, partager la promesse en cours (anti-stampede)
  if (inFlightFetchPromise) {
    const data = await inFlightFetchPromise;
    return {
      users: data,
      fromCache: false,
      lastUpdated: memoryCache ? memoryCache.timestamp : now,
    };
  }

  // 3. Lancer la synchronisation Microsoft Graph
  inFlightFetchPromise = (async () => {
    try {
      console.log('🔄 [UsersCache] Synchronisation des utilisateurs depuis Microsoft Graph...');
      const startTime = Date.now();
      const accessToken = await getGraphAccessToken();
      const graphBaseUrl = process.env.NEXT_PUBLIC_GRAPH_API || 'https://graph.microsoft.com/v1.0';

      let allUsers: DirectoryUser[] = [];
      
      // Sélection précise des champs nécessaires pour maximiser la vitesse de réponse de Graph
      const selectFields = 'id,displayName,mail,otherMails,jobTitle,department,companyName,employeeType,createdDateTime,signInActivity';
      let nextLink: string | null = `${graphBaseUrl}/users?$select=${selectFields}&$top=999`;
      let pageCount = 0;

      do {
        const response: any = await axios.get(nextLink, {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            ConsistencyLevel: 'eventual'
          },
          timeout: 25000,
        });

        const users = response.data.value || [];
        allUsers = allUsers.concat(users);
        nextLink = response.data['@odata.nextLink'] || null;
        pageCount++;

        // Limite de sécurité
        if (pageCount > 50) break;
      } while (nextLink);

      const duration = Date.now() - startTime;
      console.log(`✅ [UsersCache] ${allUsers.length} utilisateurs synchronisés en ${duration}ms (${pageCount} page(s)).`);

      // Mettre à jour le cache mémoire
      memoryCache = {
        data: allUsers,
        timestamp: Date.now(),
      };

      return allUsers;
    } catch (error) {
      console.error('❌ [UsersCache] Erreur lors de la synchronisation Graph:', error);
      // Si on a un vieux cache, le renvoyer en secours pour ne pas bloquer l'app
      if (memoryCache && memoryCache.data.length > 0) {
        console.warn('⚠️ [UsersCache] Utilisation du cache précédent en mode dégradé.');
        return memoryCache.data;
      }
      throw error;
    } finally {
      inFlightFetchPromise = null;
    }
  })();

  const users = await inFlightFetchPromise;
  return {
    users,
    fromCache: false,
    lastUpdated: memoryCache ? memoryCache.timestamp : now,
  };
}
