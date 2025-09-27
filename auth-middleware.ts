import NextAuth, { type NextAuthConfig } from "next-auth";

const defaultOrigin = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const defaultRpId = (() => { try { return new URL(defaultOrigin).hostname; } catch { return "localhost"; } })();
const env = {
  AUTH_SECRET: process.env.AUTH_SECRET || "",
  AUTH_WEBAUTHN_RP_NAME: process.env.AUTH_WEBAUTHN_RP_NAME || "Voidwrite",
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
