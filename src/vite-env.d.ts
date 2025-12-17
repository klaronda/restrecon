/// <reference types="vite/client" />

// Extend Vitest matchers with jest-dom
declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {}
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_PRICE_ID_PRO: string
  readonly VITE_STRIPE_PRICE_ID_TRIAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


