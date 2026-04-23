import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, temporaryPassword } = await request.json();

    if (!userId || !temporaryPassword) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Vérifier la session de l'utilisateur connecté (seuls les utilisateurs connectés peuvent réinitialiser)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      console.error('Configuration Azure AD manquante');
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      );
    }

    // 1. Obtenir un token d'application (Client Credentials Flow)
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
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Utiliser le token d'application pour réinitialiser le mot de passe
    await axios.patch(
      `https://graph.microsoft.com/v1.0/users/${userId}`,
      {
        passwordProfile: {
          password: temporaryPassword,
          forceChangePasswordNextSignIn: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la réinitialisation du mot de passe (API):', error.response?.data || error.message);
    
    // Renvoyer l'erreur spécifique de Graph API si disponible
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'L\'application n\'a pas les permissions suffisantes (Application permissions) pour réinitialiser le mot de passe.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.response?.data?.error?.message || 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}
