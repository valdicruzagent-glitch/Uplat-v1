'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from "@/lib/supabaseClient";
import { es } from '@/app/i18n/es';
import { en } from '@/app/i18n/en';

const supabase = getSupabaseClient();

type DashboardTab = 'inquiries' | 'favorites';

type Inquiry = any;
type FavoriteListing = any;

export default function UserDashboard() {
  const router = useRouter();
  const t = es;
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('inquiries');
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/signin?redirect=${encodeURIComponent('/dashboard')}`);
        return;
      }
      setUser({ name: user.user_metadata?.full_name || user.email?.split('@')[0] });

      // Parallel fetch
      const [inqRes, favRes] = await Promise.all([
        supabase
          .from('listing_inquiries')
          .select(`
            id,
            created_at,
            listing:listings(title),
            agent:profiles!listing_inquiries_agent_id_fkey(full_name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('listing_favorites')
          .select(`
            id,
            listing_id,
            listing:listings(title)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      // Map inquiries
      const mappedInquiries: Inquiry[] = (inqRes.data || []).map((i: any) => ({
        id: i.id,
        listing_title: i.listing?.title || 'Propiedad eliminada',
        agent_name: i.agent?.full_name || 'Agente',
        created_at: i.created_at,
      }));
      setInquiries(mappedInquiries);

      // Map favorites
      setFavorites(favRes.data || []);

      setLoading(false);
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Cargando…</p>
      </div>
    );
  }

  const tabs = [
    { id: 'inquiries' as DashboardTab, label: 'Consultas' },
    { id: 'favorites' as DashboardTab, label: 'Favoritos' },
  ];

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-[1001] border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="text-lg font-bold tracking-tight">Tualero</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <nav className="flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`pb-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'inquiries' && (
          <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Mis Consultas</h2>
            {inquiries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">Aún no tienes consultas.</p>
                <p className="text-sm text-zinc-500 mt-1">Cuando contactes a un agente, aparecerán aquí.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {inquiries.map(i => (
                  <li key={i.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="font-medium">{i.listing_title}</div>
                    <div className="text-sm text-zinc-500">Agente: {i.agent_name}</div>
                    <div className="text-sm text-zinc-400 mt-1">{new Date(i.created_at).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'favorites' && (
          <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Favoritos</h2>
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">No has marcado favoritos aún.</p>
                <p className="text-sm text-zinc-500 mt-1">Guarda propiedades para encontrarlas rápido.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {favorites.map(f => (
                  <li key={f.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="font-medium">{f.listing?.title || 'Propiedad eliminada'}</div>
                    <div className="text-sm text-zinc-500">ID: {f.listing_id}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}