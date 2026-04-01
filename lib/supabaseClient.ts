import { createBrowserClient, createClient } from '@supabase/ssr'

// Cliente para componentes cliente (use client)
export const createSupabaseClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Cliente para Server Components / Server Actions (opcional)
export const createServerSupabaseClient = (request: Request) =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith(name + '='))?.split('=')[1]
        },
        set(name: string, value: string, options: any) {
          // En server components/actions no podemos set cookies directamente;
          // normalmente se manejan en middleware o routes
        },
      },
    }
  )
