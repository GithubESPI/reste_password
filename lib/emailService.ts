import nodemailer from 'nodemailer';
import axios from 'axios';
import { getGraphAccessToken } from './graphToken';

// Échappement HTML pour prévenir les injections dans les emails
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Configuration du service d'email pour Azure AD tenant
const createTransporter = (userEmail?: string, userPassword?: string) => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  const config = {
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true pour 465, false pour 587
    auth: {
      user: userEmail || process.env.SMTP_USER,
      pass: userPassword || process.env.SMTP_PASS 
    },
    tls: {
      ciphers: 'HIGH',
      minVersion: 'TLSv1.2' as const,
      // En développement ou si explicitement désactivé, sinon validation stricte des certificats
      rejectUnauthorized: process.env.SMTP_IGNORE_TLS_ERRORS === 'true' ? false : true
    },
    debug: isDev,
    logger: isDev
  };

  console.log('=== CONFIGURATION SMTP ===');
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('User:', config.auth.user);
  console.log('Using custom user credentials:', !!userEmail);
  console.log('Secure (SSL/TLS):', config.secure);
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

// Fonction pour générer le template HTML de l'email
function generateEmailHtml(userName: string, temporaryPassword: string, senderEmailAddress: string): string {
  const safeName = escapeHtml(userName);
  const safePassword = escapeHtml(temporaryPassword);
  const safeSender = escapeHtml(senderEmailAddress);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333333;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 25px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold;">🔐 Réinitialisation de mot de passe</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Groupe ESPI - Support Technique</p>
      </div>
      
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <p style="font-size: 15px; margin-bottom: 16px;">Bonjour <strong>${safeName}</strong>,</p>
        
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Votre mot de passe a été réinitialisé par notre équipe technique suite à une demande d'assistance.
        </p>
        
        <div style="background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">NOUVEAU MOT DE PASSE TEMPORAIRE</h3>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 20px; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: bold; color: #0f172a; display: inline-block; letter-spacing: 1px;">
            ${safePassword}
          </div>
        </div>
        
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px;">⚠️ Actions requises à la première connexion</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
            <li>Connectez-vous à votre portail avec ce mot de passe temporaire</li>
            <li>Vous serez invité(e) à choisir votre propre mot de passe définitif</li>
            <li>Ce mot de passe temporaire est à usage unique</li>
          </ul>
        </div>
        
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 14px;">🔒 Bonnes pratiques de sécurité</h4>
          <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
            <li>Utilisez au moins 8 caractères avec majuscules, minuscules, chiffres et symboles</li>
            <li>Ne partagez jamais vos identifiants</li>
          </ul>
        </div>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <h4 style="color: #166534; margin: 0 0 6px 0; font-size: 14px;">📞 Support Technique</h4>
          <p style="color: #166534; margin: 0; font-size: 13px;">
            Email : <a href="mailto:${safeSender}" style="color: #166534; font-weight: bold; text-decoration: underline;">${safeSender}</a><br>
            Horaires : 9h00 - 17h00 (Lundi - Vendredi)
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 13px; margin: 0 0 6px 0;">
            Cordialement,<br>
            <strong>L'équipe technique Groupe ESPI</strong>
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Cet email a été envoyé automatiquement suite à une intervention de support.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Fonction pour envoyer un email via Microsoft Graph API (Délégué)
export const sendEmailViaGraphAPI = async (data: EmailData, accessToken: string) => {
  const senderEmailAddress = data.senderEmail || process.env.SMTP_FROM || 'dev.espi@groupe-espi.fr';

  const emailData = {
    message: {
      subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
      body: {
        contentType: 'HTML',
        content: generateEmailHtml(data.userName, data.temporaryPassword, senderEmailAddress)
      },
      toRecipients: [
        {
          emailAddress: {
            address: data.userEmail
          }
        }
      ],
      from: {
        emailAddress: {
          address: senderEmailAddress,
          name: 'Groupe ESPI - Support Technique'
        }
      }
    },
    saveToSentItems: false
  };

  try {
    console.log('=== ENVOI EMAIL VIA GRAPH API ===');
    console.log('Destinataire:', data.userEmail);
    console.log('Utilisateur:', data.userName);

    const graphBaseUrl = process.env.NEXT_PUBLIC_GRAPH_API || 'https://graph.microsoft.com/v1.0';
    const response = await axios.post(
      `${graphBaseUrl}/me/sendMail`,
      emailData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
      }
    );

    console.log('✅ Email envoyé avec succès via Graph API (Status:', response.status, ')');

    return {
      success: true,
      messageId: `graph-${Date.now()}`,
      recipient: data.userEmail
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi via Graph API:', error.response?.data || error.message);
    throw new Error(`Erreur Graph API: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Fonction pour envoyer un email via Microsoft Graph API en mode Application (Client Credentials)
export const sendEmailViaGraphApplication = async (data: EmailData) => {
  const senderEmailAddress = data.senderEmail || process.env.SMTP_FROM || 'dev.espi@groupe-espi.fr';

  console.log('=== DÉBUT ENVOI EMAIL VIA GRAPH API APPLICATION ===');
  console.log('Destinataire:', data.userEmail);
  console.log('Utilisateur:', data.userName);
  console.log('Expéditeur (Graph):', senderEmailAddress);

  // 1. Obtenir le token d'application depuis le cache partagé
  const accessToken = await getGraphAccessToken();

  // 2. Construire l'email avec échappement HTML sécurisé
  const emailPayload = {
    message: {
      subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
      body: {
        contentType: 'HTML',
        content: generateEmailHtml(data.userName, data.temporaryPassword, senderEmailAddress)
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
    const graphBaseUrl = process.env.NEXT_PUBLIC_GRAPH_API || 'https://graph.microsoft.com/v1.0';
    const graphUrl = `${graphBaseUrl}/users/${senderEmailAddress}/sendMail`;

    const response = await axios.post(
      graphUrl,
      emailPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
      }
    );

    console.log('✅ Email envoyé avec succès via Graph Application (Status:', response.status, ')');

    return {
      success: true,
      messageId: `graph-app-${Date.now()}`,
      recipient: data.userEmail
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi via Graph API Application:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error(`Erreur Graph API (403 Forbidden): L'application n'a pas les privilèges d'application "Mail.Send" requis pour envoyer des emails de la part de ${senderEmailAddress}.`);
    }
    
    throw new Error(`Erreur Graph API: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Fonction alternative pour envoyer un email via SMTP avec expéditeur masqué
export const sendPasswordResetEmailWithHiddenSender = async (data: EmailData) => {
  const senderEmailAddress = data.senderEmail || process.env.SMTP_FROM || 'dev.espi@groupe-espi.fr';

  console.log('=== DÉBUT ENVOI EMAIL SMTP ===');
  console.log('Destinataire:', data.userEmail);
  console.log('Utilisateur:', data.userName);
  console.log('Expéditeur:', senderEmailAddress);
  
  const transporter = createTransporter();
  
  try {
    await transporter.verify();
  } catch (error: any) {
    console.error('❌ Erreur de connexion SMTP:', error.message || error);
    throw new Error(`Impossible de se connecter au serveur SMTP: ${error.message || error}`);
  }
  
  const emailTemplateText = `
===============================================
RÉINITIALISATION DE MOT DE PASSE - GROUPE ESPI
===============================================

Objet: Réinitialisation de votre mot de passe - Groupe ESPI

Bonjour ${data.userName},

Nous vous informons que votre mot de passe a été réinitialisé par notre équipe technique suite à une demande d'assistance.

🔐 NOUVEAU MOT DE PASSE TEMPORAIRE :
${data.temporaryPassword}

⚠️ ACTIONS REQUISES :
• Connectez-vous avec ce mot de passe temporaire
• Vous serez automatiquement invité(e) à définir votre nouveau mot de passe
• Ce mot de passe temporaire est à usage unique

📞 SUPPORT TECHNIQUE :
Email : ${senderEmailAddress}
Horaires : 9h00 - 17h00 (Lun-Ven)

Cordialement,
L'équipe technique Groupe ESPI
===============================================
  `;

  const mailOptions = {
    from: {
      name: 'Groupe ESPI - Support Technique',
      address: senderEmailAddress
    },
    to: data.userEmail,
    subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
    text: emailTemplateText,
    html: generateEmailHtml(data.userName, data.temporaryPassword, senderEmailAddress)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès via SMTP (MessageID:', info.messageId, ')');
    
    return {
      success: true,
      messageId: info.messageId,
      recipient: data.userEmail
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi SMTP:', error.message || error);
    throw new Error(`Erreur SMTP: ${error.message || error}`);
  }
};
