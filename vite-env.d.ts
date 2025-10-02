/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
  // add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}