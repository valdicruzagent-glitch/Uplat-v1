'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/signin?redirect=${encodeURIComponent('/user-settings')}`);
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  if (loading) return <p className="p-8">Loading...</p>;

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50 p-6">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
        This is a temporary profile setup page for professionals (realtors/agencies). Please complete your public profile details.
      </p>
      <div className="rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 mb-4">
        <h2 className="font-semibold mb-2">Current Profile</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
      </div>
      <p className="text-sm">Form fields for photo, name, bio, location, and agency details will be added soon.</p>
    </div>
  );
}