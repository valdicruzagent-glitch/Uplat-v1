'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { es } from '@/app/i18n/es';
import { en } from '@/app/i18n/en';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DashboardTab = 'favorites' | 'agents' | 'inquiries';

export default function UserDashboard() {
  const router = useRouter();
  const t = es;
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('inquiries');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [savedAgents, setSavedAgents] = useState<any[]>([]);
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

      // Placeholder: fetch real data in next steps
      setFavorites([]);
      setSavedAgents([]);
      setInquiries([]);
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
    { id: 'agents' as DashboardTab, label: 'Agentes guardados' },
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
                <p className="text-sm text-zinc-500 mt-1">Guarda agentes o propiedades para encontrarlos rápido.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {favorites.map(f => (
                  <li key={f.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="font-medium">{f.name}</div>
                    <div className="text-sm text-zinc-500">{f.type}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'agents' && (
          <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Agentes guardados</h2>
            {savedAgents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">No has guardado agentes.</p>
                <p className="text-sm text-zinc-500 mt-1">Guarda a tus agentes de confianza para contactarlos fácilmente.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {savedAgents.map(a => (
                  <li key={a.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="font-medium">{a.full_name}</div>
                    <div className="text-sm text-zinc-500">{a.specialty}</div>
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
