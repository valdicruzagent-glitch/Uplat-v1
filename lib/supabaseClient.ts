import { createBrowserClient } from '@supabase/ssr'

let supabase: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    )
  }
  return supabase
}

// Alias for compatibility with code that imports createSupabaseClient
export const createSupabaseClient = getSupabaseClient
