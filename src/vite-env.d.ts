/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly BUILD_DATE: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  