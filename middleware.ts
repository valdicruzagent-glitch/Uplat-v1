// /Users/belkiscruz/.openclaw/workspace/Uplat-v1/middleware.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 🔥 Redirigir todo a tualero.com
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  
  if (hostname === 'uplat-v1.vercel.app') {
    const newUrl = new URL(url.pathname + url.search, 'https://tualero.com');
    return NextResponse.redirect(newUrl, 301);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // 🔥 CONFIGURACIÓN CRÍTICA
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              domain: 'tualero.com',  // Tu dominio personalizado
              maxAge: 60 * 60 * 24 * 7, // 7 días
            });
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  // Check profile completeness
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, whatsapp_number, terms_accepted, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isComplete = profile?.whatsapp_number && profile?.role && profile?.terms_accepted;
  const path = request.nextUrl.pathname;

  // Admin routes
  if (path.startsWith('/admin')) {
    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return response;
  }

  const excluded = ['/onboarding', '/signin', '/signup', '/api', '/_next', '/favicon.ico'];
  if (excluded.some(p => path.startsWith(p))) {
    return response;
  }

  if (!isComplete) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|onboarding|signin|signup|api/.*).*)',
  ],
};
