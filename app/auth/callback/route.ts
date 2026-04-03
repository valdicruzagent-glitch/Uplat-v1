import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        async get(name) {
          return (await cookies()).get(name)?.value;
        },
        async set(name, value, options) {
          const cookieStore = await cookies();
          cookieStore.set(name, value, options);
        },
        async remove(name, options) {
          const cookieStore = await cookies();
          cookieStore.delete({ name, ...options });
        },
      },
    });
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectTo = requestUrl.searchParams.get('redirect_to') ?? '/start';
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
