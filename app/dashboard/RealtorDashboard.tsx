'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from "@/lib/supabaseClient";
import { es } from '@/app/i18n/es';
import Link from "next/link";

export default function RealtorDashboard() {
  const t = es;
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ listings: 0, inquiries: 0, views: 0 });
  const [listings, setListings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/signin?redirect=${encodeURIComponent('/dashboard')}`);
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);

      // Fetch agent's listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, title, price_usd, mode, city, status, created_at')
        .eq('profile_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setListings(listingsData || []);

      // Fetch inquiries for agent's listings
      if (listingsData && listingsData.length > 0) {
        const listingIds = listingsData.map((l: any) => l.id);
        const { data: inquiriesData } = await supabase
          .from('listing_inquiries')
          .select('id, created_at, listing:listings(title), message')
          .in('listing_id', listingIds)
          .order('created_at', { ascending: false });
        setInquiries(inquiriesData || []);
      }

      setStats({
        listings: listingsData?.length || 0,
        inquiries: inquiriesData?.length || 0,
        views: 0, // TODO: sum views from events
      });

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

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-[1001] border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="text-lg font-bold tracking-tight">Tualero</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{profile?.full_name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Mi Dashboard</h1>
          <Link href="/submit-listing" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            Publicar propiedad
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Propiedades publicadas</div>
            <div className="text-3xl font-bold">{stats.listings}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Consultas recibidas</div>
            <div className="text-3xl font-bold">{stats.inquiries}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Vistas totales</div>
            <div className="text-3xl font-bold">{stats.views}</div>
          </div>
        </div>

        {/* Recent Listings */}
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Mis propiedades</h2>
          {listings.length > 0 ? (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {listings.slice(0, 10).map(l => (
                <li key={l.id} className="py-3 flex justify-between">
                  <div>
                    <div className="font-medium">{l.title}</div>
                    <div className="text-sm text-zinc-500">{l.city} • {l.mode === 'buy' ? 'Venta' : 'Renta'}</div>
                  </div>
                  <div className="text-sm font-medium">${Number(l.price_usd).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">Aún no has publicado propiedades.</p>
          )}
        </section>

        {/* Recent Inquiries */}
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold mb-4">Consultas recientes</h2>
          {inquiries.length > 0 ? (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {inquiries.slice(0, 10).map(i => (
                <li key={i.id} className="py-3">
                  <div className="font-medium">{i.listing?.title || 'Propiedad eliminada'}</div>
                  <div className="text-sm text-zinc-500">{new Date(i.created_at).toLocaleDateString()}</div>
                  <div className="text-sm text-zinc-400 mt-1 line-clamp-1">{i.message}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">No has recibido consultas.</p>
          )}
        </section>
      </main>
    </div>
  );
}
