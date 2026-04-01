'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from "@/lib/supabaseClient";
import { es } from '@/app/i18n/es';
import Link from "next/link";

export default function AgencyDashboard({ agencyId }: { agencyId: string }) {
  const t = es;
  const [agency, setAgency] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient();
      const { data: agencyData } = await supabase.from('agencies').select('*').eq('id', agencyId).single();
      setAgency(agencyData);

      const { data: membersData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, avatar_url')
        .eq('agency_id', agencyId)
        .eq('role', 'realtor');
      setMembers(membersData || []);

      const memberIds = (membersData || []).map((m: any) => m.id);
      if (memberIds.length > 0) {
        const { data: listingsData } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            price_usd,
            mode,
            city,
            status,
            created_at
          `)
          .in('profile_id', memberIds)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        setListings(listingsData || []);
      } else {
        setListings([]);
      }

      setLoading(false);
    };
    fetchData();
  }, [agencyId]);

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
            <span className="text-sm font-medium">{agency?.name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Agency Dashboard</h1>
          <Link href="/submit-listing" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            Publicar propiedad
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Propiedades activas</div>
            <div className="text-3xl font-bold">{listings.length}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Agentes</div>
            <div className="text-3xl font-bold">{members.length}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Consultas</div>
            <div className="text-3xl font-bold">--</div>
          </div>
        </div>

        {/* Agency info */}
        {agency && (
          <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Información de la Agencia</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nombre:</strong> {agency.name}</div>
              <div><strong>Ciudad:</strong> {agency.city || '-'}</div>
              <div><strong>Departamento:</strong> {agency.department || '-'}</div>
              <div><strong>País:</strong> {agency.country || '-'}</div>
            </div>
          </section>
        )}

        {/* Recent Listings */}
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Propiedades recientes</h2>
            <Link href="/" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
          </div>
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
            <p className="text-sm text-zinc-600">No hay propiedades publicadas aún.</p>
          )}
        </section>

        {/* Agents */}
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Agentes</h2>
            <button className="text-sm text-blue-600 hover:underline">Invitar agente</button>
          </div>
          {members.length > 0 ? (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {members.map(m => (
                <li key={m.id} className="py-3 flex items-center gap-3">
                  {m.avatar_url && (
                    <img src={m.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  )}
                  <div>
                    <div className="font-medium">{m.full_name}</div>
                    <div className="text-sm text-zinc-500">{m.phone || ''}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">No hay agentes registrados en esta agencia.</p>
          )}
        </section>
      </main>
    </div>
  );
}
