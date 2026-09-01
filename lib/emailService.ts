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
  studentEspiEmail?: string;
  senderEmail?: string;
  senderPassword?: string;
}

// Fonction pour générer le template HTML de l'email
function generateEmailHtml(
  userName: string, 
  temporaryPassword: string, 
  senderEmailAddress: string,
  studentEspiEmail?: string
): string {
  const safeName = escapeHtml(userName);
  const safePassword = escapeHtml(temporaryPassword);
  const safeSender = escapeHtml(senderEmailAddress);
  const safeLoginEmail = escapeHtml(studentEspiEmail || '');

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc;">
      
      <!-- En-tête avec bannière aux couleurs ESPI -->
      <div style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%); color: white; padding: 28px 24px; border-radius: 14px 14px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">🔐 Réinitialisation de mot de passe</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.92; font-size: 14px;">Groupe ESPI &bull; Support Technique &amp; DSI</p>
      </div>
      
      <!-- Corps principal -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 32px 28px; border-radius: 0 0 14px 14px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);">
        
        <p style="font-size: 16px; margin: 0 0 14px 0; color: #0f172a;">Bonjour <strong>${safeName}</strong>,</p>
        
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 22px 0;">
          Votre mot de passe d'accès aux services <strong>Microsoft 365 du Groupe ESPI</strong> a été réinitialisé par notre équipe technique. Retrouvez ci-dessous vos identifiants pour vous connecter à votre espace étudiant (Messagerie Outlook, Teams, Pack Office, OneDrive).
        </p>
        
        <!-- Bloc Identifiants de connexion -->
        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 22px; margin: 24px 0;">
          <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; text-align: center;">
            🔑 VOS IDENTIFIANTS DE CONNEXION
          </h3>
          
          ${safeLoginEmail ? `
          <!-- Identifiant ESPI -->
          <div style="margin-bottom: 16px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px; letter-spacing: 0.5px;">
              👤 Identifiant de connexion (Compte ESPI) :
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #1e40af; font-family: 'Consolas', 'Courier New', monospace; word-break: break-all;">
              ${safeLoginEmail}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">
              (Utilisez cet email ESPI pour vous authentifier)
            </div>
          </div>
          ` : ''}
          
          <!-- Mot de passe temporaire -->
          <div style="background: #ffffff; border: 2px dashed #2563eb; border-radius: 8px; padding: 14px 16px; text-align: center;">
            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #2563eb; margin-bottom: 6px; letter-spacing: 0.5px;">
              🔒 Mot de passe temporaire par défaut :
            </div>
            <div style="font-family: 'Consolas', 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: 1.5px; word-break: break-all;">
              ${safePassword}
            </div>
          </div>
          
          <p style="font-size: 12px; color: #64748b; margin: 12px 0 0 0; text-align: center; line-height: 1.4;">
            <em>Ce mot de passe temporaire est à usage unique et doit être remplacé dès votre première connexion.</em>
          </p>
        </div>

        <!-- Bouton d'accès direct -->
        <div style="text-align: center; margin: 28px 0 24px 0;">
          <a href="https://microsoft365.com/" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
            👉 Se connecter sur Microsoft 365
          </a>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
            Lien d'accès direct : <a href="https://microsoft365.com/" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600;">https://microsoft365.com/</a>
          </p>
        </div>

        <!-- Tutoriel pas-à-pas -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <h4 style="color: #166534; margin: 0 0 14px 0; font-size: 14px; font-weight: 700; display: flex; align-items: center;">
            📋 Guide pas-à-pas de connexion :
          </h4>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #166534; line-height: 1.5;">
            <tr>
              <td style="vertical-align: top; width: 28px; font-weight: 700; color: #15803d; padding-bottom: 10px;">1.</td>
              <td style="padding-bottom: 10px;">
                <strong>Rendez-vous sur le site :</strong> Ouvrez votre navigateur et accédez à <a href="https://microsoft365.com/" target="_blank" rel="noopener noreferrer" style="color: #15803d; font-weight: 700; text-decoration: underline;">microsoft365.com</a> puis cliquez sur <strong>« Se connecter »</strong>.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; width: 28px; font-weight: 700; color: #15803d; padding-bottom: 10px;">2.</td>
              <td style="padding-bottom: 10px;">
                <strong>Saisissez votre identifiant ESPI :</strong> Entrez votre adresse <strong>${safeLoginEmail || 'étudiante @groupe-espi.fr'}</strong> <em>(attention : n'utilisez pas votre adresse email personnelle)</em>.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; width: 28px; font-weight: 700; color: #15803d; padding-bottom: 10px;">3.</td>
              <td style="padding-bottom: 10px;">
                <strong>Entrez le mot de passe temporaire :</strong> Renseignez le mot de passe ci-dessus : <strong style="font-family: monospace;">${safePassword}</strong>.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; width: 28px; font-weight: 700; color: #15803d; padding-bottom: 10px;">4.</td>
              <td style="padding-bottom: 10px;">
                <strong>Définissez votre mot de passe personnel :</strong> L'interface vous demandera immédiatement d'indiquer votre nouveau mot de passe définitif (minimum 8 caractères avec majuscules, minuscules, chiffres et caractères spéciaux).
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; width: 28px; font-weight: 700; color: #15803d;">5.</td>
              <td>
                <strong>Sécurité &amp; Accès :</strong> Si demandé, suivez les instructions à l'écran pour configurer l'authentification multifacteur (Microsoft Authenticator / SMS). Vous accédez ensuite à Outlook, Teams et à l'ensemble de vos outils !
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Recommandations de sécurité -->
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="color: #1e40af; margin: 0 0 6px 0; font-size: 13px; font-weight: 700;">🔒 Recommandations de sécurité</h4>
          <ul style="color: #1e40af; margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6;">
            <li>Ne partagez jamais vos identifiants ou mots de passe avec qui que ce soit.</li>
            <li>Le support technique ne vous demandera jamais votre mot de passe définitif.</li>
          </ul>
        </div>
        
        <!-- Contact Support -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; margin: 20px 0; border-radius: 8px;">
          <h4 style="color: #334155; margin: 0 0 6px 0; font-size: 13px; font-weight: 700;">📞 Support Technique &amp; Assistance</h4>
          <p style="color: #475569; margin: 0; font-size: 12px; line-height: 1.5;">
            En cas de difficulté lors de votre connexion, contactez le support :<br>
            Email : <a href="mailto:${safeSender}" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${safeSender}</a><br>
            Horaires d'ouverture : 9h00 - 17h00 (du Lundi au Vendredi)
          </p>
        </div>
        
        <!-- Pied de page -->
        <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 13px; margin: 0 0 6px 0;">
            Cordialement,<br>
            <strong>L'équipe Support Informatique &bull; Groupe ESPI</strong>
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Cet email a été envoyé automatiquement suite à une intervention de réinitialisation.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Fonction pour envoyer un email via Microsoft Graph API (Délégué)
export const sendEmailViaGraphAPI = async (data: EmailData, accessToken: string) => {
  const senderEmailAddress = data.senderEmail || process.env.SMTP_FROM || 'dev.espi@groupe-espi.fr';
  const studentLoginEmail = data.studentEspiEmail || data.userEmail;

  const emailData = {
    message: {
      subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
      body: {
        contentType: 'HTML',
        content: generateEmailHtml(data.userName, data.temporaryPassword, senderEmailAddress, studentLoginEmail)
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
    console.log('Identifiant ESPI:', studentLoginEmail);

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
  const studentLoginEmail = data.studentEspiEmail || data.userEmail;

  console.log('=== DÉBUT ENVOI EMAIL VIA GRAPH API APPLICATION ===');
  console.log('Destinataire (boîte perso):', data.userEmail);
  console.log('Utilisateur:', data.userName);
  console.log('Identifiant ESPI:', studentLoginEmail);
  console.log('Expéditeur (Graph):', senderEmailAddress);

  // 1. Obtenir le token d'application depuis le cache partagé
  const accessToken = await getGraphAccessToken();

  // 2. Construire l'email avec échappement HTML sécurisé
  const emailPayload = {
    message: {
      subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
      body: {
        contentType: 'HTML',
        content: generateEmailHtml(data.userName, data.temporaryPassword, senderEmailAddress, studentLoginEmail)
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
  const studentLoginEmail = data.studentEspiEmail || data.userEmail;

  console.log('=== DÉBUT ENVOI EMAIL SMTP ===');
  console.log('Destinataire:', data.userEmail);
  console.log('Utilisateur:', data.userName);
  console.log('Identifiant ESPI:', studentLoginEmail);
  console.log('Expéditeur:', senderEmailAddress);
  
  const transporter = createTransporter();
  
  try {
    await transporter.verify();
  } catch (error: any) {
    console.error('❌ Erreur de connexion SMTP:', error.message || error);
    throw new Error(`Impossible de se connecter au serveur SMTP: ${error.message || error}`);
  }
  
  const emailTemplateText = `
=====================================================
RÉINITIALISATION DE MOT DE PASSE - GROUPE ESPI
=====================================================

Objet: Réinitialisation de votre mot de passe - Groupe ESPI

Bonjour ${data.userName},

Votre mot de passe pour accéder à vos services et outils Microsoft 365 du Groupe ESPI a été réinitialisé par notre équipe technique.

VOS IDENTIFIANTS DE CONNEXION :
-----------------------------------------------------
• Identifiant ESPI (Compte de connexion) : ${studentLoginEmail}
• Mot de passe temporaire               : ${data.temporaryPassword}
-----------------------------------------------------

COMMENT VOUS CONNECTER (GUIDE PAS À PAS) :
1. Rendez-vous sur le portail : https://microsoft365.com/
2. Saisissez votre identifiant ESPI : ${studentLoginEmail} (n'utilisez pas votre adresse personnelle)
3. Entrez le mot de passe temporaire : ${data.temporaryPassword}
4. Définissez immédiatement votre nouveau mot de passe définitif et personnel.
5. Suivez les étapes de sécurité (MFA / Authenticator) si demandées pour accéder à Outlook, Teams et vos cours.

⚠️ RAPPEL IMPORTANT :
• Ce mot de passe temporaire est à usage unique.
• Ne communiquez jamais vos identifiants à des tiers.

📞 SUPPORT TECHNIQUE :
Email    : ${senderEmailAddress}
Horaires : 9h00 - 17h00 (Lundi au Vendredi)

Cordialement,
L'équipe Support Informatique • Groupe ESPI
=====================================================
  `;

  const mailOptions = {
    from: {
      name: 'Groupe ESPI - Support Technique',
      address: senderEmailAddress
    },
    to: data.userEmail,
    subject: 'Réinitialisation de votre mot de passe - Groupe ESPI',
    text: emailTemplateText,
    html: generateEmailHtml(data.userName, data.temporaryPassword, senderEmailAddress, studentLoginEmail)
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

