import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid email profile User.Read User.Read.All User.ReadWrite.All Directory.AccessAsUser.All User-PasswordProfile.ReadWrite.All, Mail.Send",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      (session as { accessToken?: string }).accessToken = token.accessToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Forcer la redirection vers la page de redirection
      console.log("Redirect callback:", { url, baseUrl });
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/redirect`;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/redirect`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };