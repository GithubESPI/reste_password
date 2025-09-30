import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '../../../lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const { userName, temporaryPassword, userEmail } = await request.json();

    if (!userName || !temporaryPassword || !userEmail) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Envoi réel de l'email avec Nodemailer
    console.log('=== ENVOI D\'EMAIL RÉEL ===');
    console.log(`Email de secours: ${userEmail}`);
    console.log(`Utilisateur: ${userName}`);
    console.log(`Mot de passe temporaire: ${temporaryPassword}`);
    console.log('==========================');

    // Envoi de l'email avec le service Nodemailer
    const emailResult = await sendPasswordResetEmail({
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
        sender: 'dev.espi@groupe-espi.fr',
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
