// lib/msalConfig.ts
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    authority: process.env.NEXT_PUBLIC_AUTHORITY!,
    redirectUri: "/", // ou une autre route
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
