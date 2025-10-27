import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmailWithHiddenSender } from '../../../lib/emailService';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const { userName, temporaryPassword, userEmail } = await request.json();

    if (!userName || !temporaryPassword || !userEmail) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Récupérer la session de l'utilisateur connecté (pour logging uniquement)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Session utilisateur non trouvée' },
        { status: 401 }
      );
    }

    // Envoi réel de l'email via SMTP avec identifiants fixes
    console.log('=== ENVOI D\'EMAIL VIA SMTP ===');
    console.log(`Email de secours: ${userEmail}`);
    console.log(`Utilisateur: ${userName}`);
    console.log(`Mot de passe temporaire: ${temporaryPassword}`);
    console.log(`Expéditeur: dev.espi@groupe-espi.fr`);
    console.log(`Utilisateur connecté: ${session.user.email}`);
    console.log('===============================');

    // Envoi de l'email via SMTP avec expéditeur masqué
    const emailResult = await sendPasswordResetEmailWithHiddenSender({
      userName,
      temporaryPassword,
      userEmail
    });

    console.log('=== RÉSULTAT DE L\'ENVOI ===');
    console.log('Message ID:', emailResult.messageId);
    console.log('Destinataire:', emailResult.recipient);
    console.log('============================');

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      data: {
        recipient: userEmail,
        userName,
        sender: 'dev.espi@groupe-espi.fr', // Expéditeur masqué
        subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
        messageId: emailResult.messageId,
        sentAt: new Date().toISOString(),
        template: 'password-reset-professional'
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
