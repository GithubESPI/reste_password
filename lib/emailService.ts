import nodemailer from 'nodemailer';

// Configuration du service d'email pour Azure AD tenant
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true pour 465, false pour autres ports
    auth: {
      user: process.env.SMTP_USER || 'dev.espi@groupe-espi.fr',
      pass: process.env.SMTP_PASS || 'espi2077*'
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });
};

export interface EmailData {
  userName: string;
  temporaryPassword: string;
  userEmail: string;
}

export const sendPasswordResetEmail = async (data: EmailData) => {
  const transporter = createTransporter();
  
  const emailTemplate = `
===============================================
RÉINITIALISATION DE MOT DE PASSE - GROUPE ESPI
===============================================

Objet: Réinitialisation de votre mot de passe - Groupe ESPI

Bonjour ${data.userName},

Nous vous informons que votre mot de passe a été réinitialisé par notre équipe technique 
suite à une demande de réinitialisation.

🔐 NOUVEAU MOT DE PASSE TEMPORAIRE :
┌─────────────────────────────────────┐
│ ${data.temporaryPassword}                │
└─────────────────────────────────────┘

⚠️ ACTIONS REQUISES IMMÉDIATEMENT :
• Connectez-vous avec ce mot de passe temporaire
• Vous serez automatiquement redirigé vers la page de changement de mot de passe
• Choisissez un nouveau mot de passe sécurisé
• Ce mot de passe temporaire expirera dans 24 heures

🔒 RECOMMANDATIONS DE SÉCURITÉ :
• Utilisez au moins 8 caractères
• Incluez des majuscules, minuscules, chiffres et symboles
• Ne partagez jamais votre mot de passe
• Changez-le régulièrement
• Évitez les mots de passe évidents

📞 SUPPORT TECHNIQUE :
Si vous rencontrez des difficultés, contactez notre équipe :
• Email : dev.espi@groupe-espi.fr
• Horaires : 9h00 - 17h00 (Lun-Ven)

🛡️ SÉCURITÉ :
Si vous n'avez pas demandé cette réinitialisation, contactez immédiatement 
notre équipe de sécurité.

Cordialement,
L'équipe technique Groupe ESPI
dev.espi@groupe-espi.fr

===============================================
Cet email a été envoyé automatiquement.
Merci de ne pas y répondre directement.
===============================================
  `;

  const mailOptions = {
    from: {
      name: 'Groupe ESPI - Support Technique',
      address: 'dev.espi@groupe-espi.fr'
    },
    to: data.userEmail,
    subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
    text: emailTemplate,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🔐 Réinitialisation de mot de passe</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Groupe ESPI - Support Technique</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>${data.userName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            Nous vous informons que votre mot de passe a été réinitialisé par notre équipe technique 
            suite à une demande de réinitialisation.
          </p>
          
          <div style="background: #fff; border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="color: #e74c3c; margin: 0 0 10px 0;">🔐 NOUVEAU MOT DE PASSE TEMPORAIRE</h3>
            <div style="background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 15px; font-family: monospace; font-size: 18px; font-weight: bold; color: #2c3e50;">
              ${data.temporaryPassword}
            </div>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ ACTIONS REQUISES IMMÉDIATEMENT</h4>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Connectez-vous avec ce mot de passe temporaire</li>
              <li>Vous serez automatiquement redirigé vers la page de changement de mot de passe</li>
              <li>Choisissez un nouveau mot de passe sécurisé</li>
              <li>Ce mot de passe temporaire expirera dans 24 heures</li>
            </ul>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #0c5460; margin: 0 0 10px 0;">🔒 RECOMMANDATIONS DE SÉCURITÉ</h4>
            <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
              <li>Utilisez au moins 8 caractères</li>
              <li>Incluez des majuscules, minuscules, chiffres et symboles</li>
              <li>Ne partagez jamais votre mot de passe</li>
              <li>Changez-le régulièrement</li>
            </ul>
          </div>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #155724; margin: 0 0 10px 0;">📞 SUPPORT TECHNIQUE</h4>
            <p style="color: #155724; margin: 0;">Si vous rencontrez des difficultés, contactez notre équipe :</p>
            <ul style="color: #155724; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Email : dev.espi@groupe-espi.fr</li>
              <li>Horaires : 9h00 - 17h00 (Lun-Ven)</li>
            </ul>
          </div>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #721c24; margin: 0 0 10px 0;">🛡️ SÉCURITÉ</h4>
            <p style="color: #721c24; margin: 0;">
              Si vous n'avez pas demandé cette réinitialisation, contactez immédiatement 
              notre équipe de sécurité.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Cordialement,<br>
              <strong>L'équipe technique Groupe ESPI</strong><br>
              dev.espi@groupe-espi.fr
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      recipient: data.userEmail
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email');
  }
};
