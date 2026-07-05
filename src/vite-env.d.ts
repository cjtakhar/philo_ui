/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional override for the backend base URL (e.g. a preview API).
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
