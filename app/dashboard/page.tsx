'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import LanguageSwitch from "@/app/components/LanguageSwitch";
import { es } from "@/app/i18n/es";
import { en } from "@/app/i18n/en";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserDashboard() {
  const router = useRouter();
  const t = es;
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/signin?redirect=${encodeURIComponent('/dashboard')}`);
        return;
      }
      setUser({ name: user.user_metadata?.full_name || user.email?.split('@')[0] });

      // Fetch user's favorites (from realtor_leads or a favorites table)
      // For now, placeholder: empty arrays
      setFavorites([]);
      setInquiries([]);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-[1001] border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="text-lg font-bold tracking-tight">Tualero</div>
          <div className="flex items-center gap-4">
            <LanguageSwitch current="es" />
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Favorites */}
          <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Saved Agents</h2>
            {favorites.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No saved agents yet.</p>
            ) : (
              <ul className="space-y-3">
                {favorites.map(f => (
                  <li key={f.id} className="text-sm">{f.name}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Inquiries */}
          <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold mb-4">My Inquiries</h2>
            {inquiries.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No inquiries yet.</p>
            ) : (
              <ul className="space-y-3">
                {inquiries.map(i => (
                  <li key={i.id} className="text-sm">
                    <div className="font-medium">{i.listing_title}</div>
                    <div className="text-zinc-500">To: {i.agent_name}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
