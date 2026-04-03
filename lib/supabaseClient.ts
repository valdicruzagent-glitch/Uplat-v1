import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabase: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          const headers = new Headers(options.headers)
          if (!headers.has('apikey')) {
            headers.set('apikey', supabaseAnonKey)
          }
          return fetch(url, { ...options, headers })
        }
      }
    })
  }
  return supabase
}

// Alias for compatibility with code that imports createSupabaseClient
export const createSupabaseClient = getSupabaseClient
