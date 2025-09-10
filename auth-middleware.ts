import NextAuth, { type NextAuthConfig } from "next-auth";

const env = {
  AUTH_SECRET: process.env.AUTH_SECRET || "",
  AUTH_WEBAUTHN_RP_NAME: process.env.AUTH_WEBAUTHN_RP_NAME || "My Blog",
  AUTH_WEBAUTHN_RP_ID: process.env.AUTH_WEBAUTHN_RP_ID || "localhost",
  AUTH_WEBAUTHN_ORIGIN: process.env.AUTH_WEBAUTHN_ORIGIN || "http://localhost:3000",
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
      const u: any = session.user ?? {};
      u.id = (token as any)?.sub ?? null;
      u.role = (token as any)?.role ?? undefined;
      session.user = u;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);
