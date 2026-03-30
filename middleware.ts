import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  // Check profile completeness: phone collected, role, and terms acceptance must be present
  const { data: profile } = await supabase.from('profiles')
    .select('role, whatsapp_number, terms_accepted, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isComplete = profile?.whatsapp_number && profile?.role && profile?.terms_accepted;

  const onboardingPath = '/onboarding';
  const path = request.nextUrl.pathname;

  // Admin routes: require is_admin
  if (path.startsWith('/admin')) {
    if (!profile?.is_admin) {
      // Not admin; redirect to home
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return response; // admin allowed
  }

  const excluded = ['/onboarding', '/signin', '/signup', '/api', '/_next', '/favicon.ico'];
  if (excluded.some(p => path.startsWith(p))) {
    return response;
  }

  if (!isComplete) {
    const url = request.nextUrl.clone();
    url.pathname = onboardingPath;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|onboarding|signin|signup|api/.*).*)',
  ],
};
