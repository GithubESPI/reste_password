import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmailWithHiddenSender, sendEmailViaGraphApplication } from '../../../lib/emailService';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userName, temporaryPassword, userEmail, studentEspiEmail, espiEmail } = await request.json();
    const loginEmail = studentEspiEmail || espiEmail || userEmail;

    if (!userName || !temporaryPassword || !userEmail) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Récupérer la session de l'utilisateur connecté
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Session utilisateur non trouvée' },
        { status: 401 }
      );
    }

    const emailMethod = process.env.EMAIL_METHOD || 'SMTP';
    const senderEmail = process.env.SMTP_FROM || 'dev.espi@groupe-espi.fr';

    console.log('=== PROCESSUS D\'ENVOI DE L\'EMAIL ===');
    console.log('Méthode d\'envoi :', emailMethod);
    console.log('Destinataire (boîte de réception) :', userEmail);
    console.log('Identifiant étudiant (ESPI) :', loginEmail);
    console.log('Expéditeur :', senderEmail);
    console.log('Effectué par :', session.user.email);
    console.log('====================================');

    // Envoi de l'email selon la méthode configurée avec un mécanisme de fallback automatique
    let emailResult;
    let fallbackUsed = false;
    const errors: string[] = [];

    if (emailMethod.toUpperCase() === 'GRAPH') {
      try {
        emailResult = await sendEmailViaGraphApplication({
          userName,
          temporaryPassword,
          userEmail,
          studentEspiEmail: loginEmail
        });
      } catch (graphError: any) {
        console.warn('⚠️ Échec de l\'envoi principal via GRAPH. Tentative de fallback SMTP...', graphError.message || graphError);
        errors.push(`GRAPH: ${graphError.message || graphError}`);
        try {
          emailResult = await sendPasswordResetEmailWithHiddenSender({
            userName,
            temporaryPassword,
            userEmail,
            studentEspiEmail: loginEmail
          });
          fallbackUsed = true;
          console.log('✅ Envoi réussi via fallback SMTP');
        } catch (smtpError: any) {
          console.error('❌ Échec du fallback SMTP également.', smtpError.message || smtpError);
          errors.push(`SMTP: ${smtpError.message || smtpError}`);
          throw new Error(`Tous les modes d'envoi d'email ont échoué. Détails : [${errors.join(' | ')}]`);
        }
      }
    } else {
      try {
        emailResult = await sendPasswordResetEmailWithHiddenSender({
          userName,
          temporaryPassword,
          userEmail,
          studentEspiEmail: loginEmail
        });
      } catch (smtpError: any) {
        console.warn('⚠️ Échec de l\'envoi principal via SMTP. Tentative de fallback GRAPH...', smtpError.message || smtpError);
        errors.push(`SMTP: ${smtpError.message || smtpError}`);
        try {
          emailResult = await sendEmailViaGraphApplication({
            userName,
            temporaryPassword,
            userEmail,
            studentEspiEmail: loginEmail
          });
          fallbackUsed = true;
          console.log('✅ Envoi réussi via fallback GRAPH');
        } catch (graphError: any) {
          console.error('❌ Échec du fallback GRAPH également.', graphError.message || graphError);
          errors.push(`GRAPH: ${graphError.message || graphError}`);
          throw new Error(`Tous les modes d'envoi d'email ont échoué. Détails : [${errors.join(' | ')}]`);
        }
      }
    }

    console.log('=== RÉSULTAT DE L\'ENVOI ===');
    console.log('Message ID:', emailResult.messageId);
    console.log('Destinataire:', emailResult.recipient);
    console.log('Fallback utilisé:', fallbackUsed ? 'Oui' : 'Non');
    console.log('============================');

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      data: {
        recipient: userEmail,
        studentEspiEmail: loginEmail,
        userName,
        sender: senderEmail,
        subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
        messageId: emailResult.messageId,
        sentAt: new Date().toISOString(),
        template: 'password-reset-professional'
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
