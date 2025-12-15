import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing! Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  console.error('Current values:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0
  });
}

// Chrome storage adapter so sessions persist and are shared with extension
const chromeStorage =
  typeof chrome !== 'undefined' && chrome?.storage?.local
    ? {
        getItem: (key: string) =>
          new Promise<string | null>((resolve) => {
            chrome.storage.local.get([key], (res) => resolve((res as any)?.[key] ?? null));
          }),
        setItem: (key: string, value: string) =>
          new Promise<void>((resolve) => {
            chrome.storage.local.set({ [key]: value }, () => resolve());
          }),
        removeItem: (key: string) =>
          new Promise<void>((resolve) => {
            chrome.storage.local.remove([key], () => resolve());
          }),
      }
    : undefined;

// Create client with fallback to prevent crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: chromeStorage, // Use chrome storage if available, falls back to localStorage
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Enable for extension redirects
    },
  }
);




