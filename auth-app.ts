import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Passkey from "next-auth/providers/passkey";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { accounts, users, sessions, verificationTokens, authenticators } from "./db/auth-schema";
import { eq } from "drizzle-orm";
import { profiles } from "./db/schema";
import { verifyPassword } from "./lib/password";

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
  session: { strategy: "jwt" },
  experimental: { enableWebAuthn: true },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const identifier = creds?.email?.toString().toLowerCase();
        const password = creds?.password?.toString() ?? "";
        if (!identifier || !password) return null;

        let user: any | null = null;
        if (identifier.includes('@')) {
          const rows = await db.select().from(users).where(eq(users.email, identifier));
          user = rows?.[0] || null;
        } else {
          const prof = (await db.select().from(profiles).where(eq(profiles.username, identifier)))?.[0];
          if (prof) {
            const rows = await db.select().from(users).where(eq(users.id, prof.userId));
            user = rows?.[0] || null;
          }
        }
        if (!user) return null;

        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
        if (!profile?.passwordHash || profile.suspended) return null;
        const ok = await verifyPassword(profile.passwordHash, password);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image } as any;
      },
    }),
    Passkey({
      relayingParty: {
        name: env.AUTH_WEBAUTHN_RP_NAME,
        id: env.AUTH_WEBAUTHN_RP_ID,
        origin: env.AUTH_WEBAUTHN_ORIGIN,
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const id = (user as any)?.id ?? (token as any)?.sub;
      if (id) {
        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, id as string));
        (token as any).role = profile?.role ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).sub;
        (session.user as any).role = (token as any).role ?? undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
