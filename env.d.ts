declare namespace NodeJS {
  interface ProcessEnv {
    // Public (client-safe) variants
    NEXT_PUBLIC_SANITY_PROJECT_ID: string;
    NEXT_PUBLIC_SANITY_DATASET: string;

    // Server-side only
    SANITY_API_PROJECT_ID: string;
    SANITY_API_DATASET: string;
    SANITY_STUDIO_PROJECT_ID?: string;
    SANITY_STUDIO_DATASET?: string;
    SANITY_API_READ_TOKEN?: string;
    SANITY_API_WRITE_TOKEN?: string;

    // Optional basic auth for /studio
    STUDIO_BASIC_AUTH_USER?: string;
    STUDIO_BASIC_AUTH_PASS?: string;
  }
}

