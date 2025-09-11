declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    DATABASE_URL: string;

    // Auth.js / NextAuth
    AUTH_SECRET: string;
    NEXTAUTH_URL?: string;

    // Passkeys (WebAuthn)
    AUTH_WEBAUTHN_RP_NAME: string; // e.g. "My Blog"
    AUTH_WEBAUTHN_RP_ID: string;   // e.g. "my-domain.com"
    AUTH_WEBAUTHN_ORIGIN: string;  // e.g. "https://my-domain.com"

    // Vercel Blob
    BLOB_READ_WRITE_TOKEN?: string;
  }
}
