import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import UserDashboard from './UserDashboard';
import AgencyDashboard from './AgencyDashboard';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {}, // no need to set cookies on server
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/signin?redirect=/dashboard');
  }

  const { data: profile } = await supabase.from('profiles').select('role, agency_id').eq('id', user.id).single();

  if (profile?.role === 'agency') {
    // Ensure agency_id exists, otherwise fallback to user-settings (complete profile)
    if (!profile.agency_id) {
      redirect('/user-settings');
    }
    return <AgencyDashboard agencyId={profile.agency_id} />;
  }

  // For 'realtor' or 'user' roles
  return <UserDashboard />;
}
