import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { addLog } from '../../../lib/logger';
import { getGraphAccessToken } from '../../../lib/graphToken';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, userName, userEmail, temporaryPassword } = await request.json();

    if (!userId || !temporaryPassword) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Vérifier la session de l'utilisateur connecté
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // 1. Obtenir le token d'application depuis le cache partagé
    const accessToken = await getGraphAccessToken();

    // 2. Réinitialiser le mot de passe via Microsoft Graph
    const graphBaseUrl = process.env.NEXT_PUBLIC_GRAPH_API || 'https://graph.microsoft.com/v1.0';
    await axios.patch(
      `${graphBaseUrl}/users/${userId}`,
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
        },
        timeout: 15000,
      }
    );

    // 3. Enregistrer l'action dans le journal d'audit
    addLog({
      action: 'RESET_PASSWORD',
      targetUserId: userId,
      targetUserName: userName || 'Utilisateur inconnu',
      targetUserEmail: userEmail,
      performedByEmail: session.user.email,
      performedByName: session.user.name || session.user.email,
    });

    console.log(`✅ Mot de passe réinitialisé avec succès pour l'utilisateur ID: ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la réinitialisation du mot de passe (API):', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: "L'application n'a pas les permissions suffisantes (User-PasswordProfile.ReadWrite.All) dans Azure AD." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.response?.data?.error?.message || 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}
