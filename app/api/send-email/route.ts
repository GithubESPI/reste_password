import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userName, temporaryPassword, userEmail } = await request.json();

    if (!userName || !temporaryPassword || !userEmail) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Pour l'instant, on simule l'envoi d'email
    // Dans un environnement de production, vous intégreriez ici un service d'email
    // comme SendGrid, Mailgun, Nodemailer, etc.
    
    console.log('=== EMAIL DE RÉINITIALISATION DE MOT DE PASSE ===');
    console.log(`Destinataire: ${userEmail}`);
    console.log(`Utilisateur: ${userName}`);
    console.log(`Mot de passe temporaire: ${temporaryPassword}`);
    console.log('===============================================');

    // Simulation d'un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Dans un vrai environnement, vous feriez quelque chose comme :
    /*
    const emailService = new EmailService();
    await emailService.send({
      to: userEmail,
      subject: 'Réinitialisation de votre mot de passe',
      template: 'password-reset',
      data: {
        userName,
        temporaryPassword,
        loginUrl: process.env.NEXTAUTH_URL + '/login'
      }
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      data: {
        recipient: userEmail,
        userName,
        sentAt: new Date().toISOString()
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
