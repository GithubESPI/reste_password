import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Vérifier la session de l'utilisateur connecté
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      console.error('Configuration Azure AD manquante');
      return NextResponse.json({ error: 'Erreur de configuration serveur' }, { status: 500 });
    }

    // 1. Obtenir un token d'application (Client Credentials Flow)
    // Cela permet d'utiliser les permissions de l'application (comme Directory.Read.All et AuditLog.Read.All)
    // et donc de contourner l'erreur "User is not in the allowed roles"
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Récupérer les utilisateurs depuis Microsoft Graph avec pagination
    let allUsers: any[] = [];
    let nextLink: string | null = `https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,otherMails,jobTitle,department,companyName,employeeType,createdDateTime,signInActivity&$top=999`;
    let pageCount = 0;

    do {
      const response: any = await axios.get(nextLink, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const users = response.data.value || [];
      allUsers = [...allUsers, ...users];
      nextLink = response.data['@odata.nextLink'] || null;
      pageCount++;

      // Limite de sécurité
      if (pageCount > 50) break;
    } while (nextLink);

    return NextResponse.json({ users: allUsers });
  } catch (error: any) {
    console.error('Erreur API users:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'L\'application n\'a pas les permissions nécessaires (AuditLog.Read.All, Directory.Read.All) dans Azure AD.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}