import nodemailer from 'nodemailer';
import axios from 'axios';

// Configuration du service d'email pour Azure AD tenant
const createTransporter = (userEmail?: string, userPassword?: string) => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true pour 465, false pour autres ports
    auth: {
      user: userEmail || process.env.SMTP_USER,
      pass: userPassword || process.env.SMTP_PASS 
    },
    tls: {
      ciphers: 'HIGH',
      minVersion: 'TLSv1.2' as const,
      rejectUnauthorized: false
    },
    debug: true, // Active les logs de débogage SMTP
    logger: true // Active les logs Nodemailer /
  };

  console.log('=== CONFIGURATION SMTP ===');
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('User:', config.auth.user);
  console.log('Using user credentials:', !!userEmail);
  console.log('Secure:', config.secure);
  console.log('========================');

  return nodemailer.createTransport(config);
};

export interface EmailData {
  userName: string;
  temporaryPassword: string;
  userEmail: string;
  senderEmail?: string;
  senderPassword?: string;
}

// Fonction pour envoyer un email via Microsoft Graph API
export const sendEmailViaGraphAPI = async (data: EmailData, accessToken: string) => {
  const emailData = {
    message: {
      subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
      body: {
        contentType: 'HTML',
        content: `
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
      },
      toRecipients: [
        {
          emailAddress: {
            address: data.userEmail
          }
        }
      ],
      // Masquer l'expéditeur réel en utilisant un compte système
      from: {
        emailAddress: {
          address: 'dev.espi@groupe-espi.fr',
          name: 'Groupe ESPI - Support Technique'
        }
      }
    },
    saveToSentItems: false // Ne pas sauvegarder dans les éléments envoyés de l'utilisateur
  };

  try {
    console.log('=== ENVOI EMAIL VIA GRAPH API ===');
    console.log('Destinataire:', data.userEmail);
    console.log('Utilisateur:', data.userName);
    console.log('===============================');

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_GRAPH_API}/me/sendMail`,
      emailData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS VIA GRAPH API');
    console.log('Response status:', response.status);
    console.log('=====================================');

    return {
      success: true,
      messageId: `graph-${Date.now()}`,
      recipient: data.userEmail
    };
  } catch (error) {
    console.error('❌ ERREUR LORS DE L\'ENVOI VIA GRAPH API:', error);
    throw new Error(`Erreur Graph API: ${error}`);
  }
};

// Fonction pour envoyer un email via Microsoft Graph API en mode Application (Client Credentials)
export const sendEmailViaGraphApplication = async (data: EmailData) => {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const senderEmailAddress = data.senderEmail || process.env.SMTP_FROM || 'dev.espi@groupe-espi.fr';

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Configuration Azure AD manquante pour l\'envoi de mail');
  }

  console.log('=== DÉBUT ENVOI EMAIL VIA GRAPH API APPLICATION ===');
  console.log('Destinataire:', data.userEmail);
  console.log('Utilisateur:', data.userName);
  console.log('Expéditeur (Graph):', senderEmailAddress);

  // 1. Obtenir un token d'application (Client Credentials Flow)
  let accessToken: string;
  try {
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
    accessToken = tokenResponse.data.access_token;
    console.log('✅ Token d\'application Microsoft Graph obtenu avec succès');
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'obtention du token d\'application:', error.response?.data || error.message);
    throw new Error(`Impossible d'obtenir le token d'application Microsoft Graph: ${error.message}`);
  }

  // 2. Construire l'email
  const emailPayload = {
    message: {
      subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
      body: {
        contentType: 'HTML',
        content: `
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
                  <li>Email : ${senderEmailAddress}</li>
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
                  ${senderEmailAddress}
                </p>
                <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                  Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
                </p>
              </div>
            </div>
          </div>
        `
      },
      toRecipients: [
        {
          emailAddress: {
            address: data.userEmail
          }
        }
      ]
    },
    saveToSentItems: false
  };

  // 3. Envoyer l'email via Microsoft Graph API
  try {
    const graphUrl = `${process.env.NEXT_PUBLIC_GRAPH_API || 'https://graph.microsoft.com/v1.0'}/users/${senderEmailAddress}/sendMail`;
    console.log(`Appel de l'API Graph : ${graphUrl}`);

    const response = await axios.post(
      graphUrl,
      emailPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS VIA GRAPH API APPLICATION');
    console.log('Response status:', response.status);
    console.log('===================================================');

    return {
      success: true,
      messageId: `graph-app-${Date.now()}`,
      recipient: data.userEmail
    };
  } catch (error: any) {
    console.error('❌ ERREUR LORS DE L\'ENVOI VIA GRAPH API APPLICATION:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error(`Erreur Graph API (403 Forbidden): L'application n'a pas les privilèges d'application "Mail.Send" requis pour envoyer des emails de la part de ${senderEmailAddress}. Veuillez accorder le consentement administrateur dans Azure AD.`);
    }
    
    throw new Error(`Erreur Graph API: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Fonction alternative pour envoyer un email via SMTP avec expéditeur masqué
export const sendPasswordResetEmailWithHiddenSender = async (data: EmailData) => {
  const senderEmailAddress = data.senderEmail || process.env.SMTP_FROM || 'dev.espi@groupe-espi.fr';

  console.log('=== DÉBUT ENVOI EMAIL SMTP AVEC EXPÉDITEUR MASQUÉ ===');
  console.log('Destinataire:', data.userEmail);
  console.log('Utilisateur:', data.userName);
  console.log('Mot de passe:', data.temporaryPassword);
  console.log('Expéditeur masqué:', senderEmailAddress);
  
  // Utiliser les identifiants système pour masquer l'expéditeur réel
  const transporter = createTransporter();
  
  // Vérification de la connexion SMTP
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée avec succès');
  } catch (error: any) {
    console.error('❌ Erreur de connexion SMTP:', error);
    throw new Error(`Impossible de se connecter au serveur SMTP: ${error.message || error}`);
  }
  
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

• Horaires : 9h00 - 17h00 (Lun-Ven)

🛡️ SÉCURITÉ :
Si vous n'avez pas demandé cette réinitialisation, contactez immédiatement 
notre équipe de sécurité.

Cordialement,
L'équipe technique Groupe ESPI


===============================================
Cet email a été envoyé automatiquement.
Merci de ne pas y répondre directement.
===============================================
  `;

  const mailOptions = {
    from: {
      name: 'Groupe ESPI - Support Technique',
      address: senderEmailAddress
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
              <li>Email : ${senderEmailAddress}</li>
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
              ${senderEmailAddress}
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
    console.log('=== ENVOI EMAIL VIA SMTP ===');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('============================');
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS VIA SMTP');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('=====================================');
    
    return {
      success: true,
      messageId: info.messageId,
      recipient: data.userEmail
    };
  } catch (error) {
    console.error('❌ ERREUR LORS DE L\'ENVOI SMTP:', error);
    console.error('Détails de l\'erreur:', error);
    throw new Error(`Erreur SMTP: ${error}`);
  }
};
