/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN: string;
  readonly VITE_AUTH0_CLIENT_ID: string;
  // add other env variables as you use them
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}