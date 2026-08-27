import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid email profile User.Read",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session }) {
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        if (url === baseUrl || url === `${baseUrl}/`) {
          return `${baseUrl}/redirect`;
        }
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;
        return `${baseUrl}/redirect`;
      } catch {
        return `${baseUrl}/redirect`;
      }
    },
  },
};
