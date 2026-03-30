import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(c => cookieStore.set(c.name, c.value, c.options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/signin?redirect=${encodeURIComponent('/admin/dashboard')}`);
  }

  // Admin check: require is_admin flag on profiles
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) {
    redirect('/');
  }

  // Render admin dashboard (stats will be added later)
  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-black p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Admin functionality coming soon.</p>
    </div>
  );
}
