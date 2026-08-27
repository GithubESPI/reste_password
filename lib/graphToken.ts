import axios from 'axios';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp in ms
}

let cachedToken: CachedToken | null = null;
let pendingTokenPromise: Promise<string> | null = null;

/**
 * Récupère un token d'application Microsoft Graph avec mise en cache mémoire.
 * Évite les requêtes réseau répétées vers l'endpoint OAuth de Microsoft (gain ~300-600ms).
 */
export async function getGraphAccessToken(): Promise<string> {
  const now = Date.now();

  // Si le token en cache est encore valide (avec une marge de sécurité de 5 minutes)
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  // Si une requête d'obtention de token est déjà en cours, réutiliser la même promesse (anti-stampede)
  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    try {
      const tenantId = process.env.AZURE_AD_TENANT_ID;
      const clientId = process.env.AZURE_AD_CLIENT_ID;
      const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

      if (!tenantId || !clientId || !clientSecret) {
        throw new Error('Configuration Azure AD manquante (AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET)');
      }

      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: clientId,
          scope: 'https://graph.microsoft.com/.default',
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      const accessToken = tokenResponse.data.access_token;
      const expiresInSec = tokenResponse.data.expires_in || 3599;

      cachedToken = {
        accessToken,
        expiresAt: now + expiresInSec * 1000,
      };

      return accessToken;
    } finally {
      pendingTokenPromise = null;
    }
  })();

  return pendingTokenPromise;
}
