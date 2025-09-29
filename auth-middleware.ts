import NextAuth, { type NextAuthConfig } from "next-auth";

import { siteConfig } from "./site";

const defaultOrigin = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const defaultRpId = (() => {
  try {
    return new URL(defaultOrigin).hostname;
  } catch {
    return "localhost";
  }
})();

const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
}

const env = {
  AUTH_SECRET: authSecret,
  AUTH_WEBAUTHN_RP_NAME: process.env.AUTH_WEBAUTHN_RP_NAME || siteConfig.studio.name,
  AUTH_WEBAUTHN_RP_ID: process.env.AUTH_WEBAUTHN_RP_ID || defaultRpId,
  AUTH_WEBAUTHN_ORIGIN: process.env.AUTH_WEBAUTHN_ORIGIN || defaultOrigin,
};

export const authConfig = {
  secret: env.AUTH_SECRET,
  trustHost: true,
  // Edge middleware must avoid Node adapters/providers; use stateless JWT
  session: { strategy: "jwt" },
  experimental: { enableWebAuthn: true },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if ((token as any)?.suspended) {
        if (session.user) {
          delete (session as any).user;
        }
      } else {
        const u: any = session.user ?? {};
        u.id = (token as any)?.sub ?? null;
        u.role = (token as any)?.role ?? undefined;
        session.user = u;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);
