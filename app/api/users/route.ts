import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getCachedUsers } from '../../../lib/usersCache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier la session de l'utilisateur connecté
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Paramètre optionnel pour forcer le rafraîchissement du cache
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    // 2. Récupérer les utilisateurs (servi instantanément depuis le cache mémoire serveur si valide)
    const { users, fromCache, lastUpdated } = await getCachedUsers(forceRefresh);

    return NextResponse.json({ 
      users,
      fromCache,
      lastUpdated,
      count: users.length 
    });
  } catch (error: any) {
    console.error('Erreur API users:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: "L'application n'a pas les permissions nécessaires (AuditLog.Read.All, Directory.Read.All) dans Azure AD." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}