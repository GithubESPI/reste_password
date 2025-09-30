# Configuration SMTP pour l'envoi d'emails

## Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration SMTP Office 365
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=dev.espi@groupe-espi.fr
SMTP_PASS=espi2077*
```

## Configuration du service

Le service utilise Nodemailer avec les paramètres suivants :

- **Host** : smtp.office365.com (Office 365)
- **Port** : 587 (TLS)
- **Sécurité** : TLS avec chiffrement SSLv3
- **Authentification** : Login/Password
- **Debug** : Activé pour les logs détaillés

## Vérification de la connexion

Le service vérifie automatiquement la connexion SMTP avant l'envoi :

```typescript
await transporter.verify();
```

## Logs de débogage

Les logs suivants sont affichés dans la console :

1. **Configuration SMTP** : Host, Port, User, Secure
2. **Vérification connexion** : ✅ ou ❌
3. **Détails d'envoi** : From, To, Subject
4. **Résultat** : Message ID, Response, Accepted, Rejected

## Test de l'envoi

Pour tester l'envoi d'email :

1. Assurez-vous que les variables d'environnement sont définies
2. Lancez l'application : `npm run dev`
3. Connectez-vous et testez la réinitialisation de mot de passe
4. Vérifiez les logs dans la console pour confirmer l'envoi SMTP

## Dépannage

Si l'envoi échoue, vérifiez :

1. **Identifiants** : Email et mot de passe corrects
2. **Connexion réseau** : Accès à smtp.office365.com
3. **Authentification** : Compte Office 365 actif
4. **Permissions** : Autorisation d'envoi d'emails
