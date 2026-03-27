'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Profile } from '@/app/types/profile';
import LanguageSwitch from '@/app/components/LanguageSwitch';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AgentsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [likedAgents, setLikedAgents] = useState<Set<string>>(new Set());

  // Get current user profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setCurrentProfileId(data.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentProfileId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch all realtors with listing counts and likes_count
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          full_name,
          phone,
          avatar_url,
          bio,
          country,
          department,
          city,
          created_at,
          updated_at,
          likes_count
        `)
        .eq('role', 'realtor');

      if (!error && data) {
        // Fetch listing counts for published listings grouped by profile_id
        const ids = (data as any[]).map(p => p.id);
        const { data: countsData } = await supabase
          .from('listings')
          .select('profile_id')
          .eq('status', 'published')
          .in('profile_id', ids);
        const countMap = new Map<string, number>();
        countsData?.forEach((l: any) => {
          const pid = l.profile_id as string;
          countMap.set(pid, (countMap.get(pid) || 0) + 1);
        });
        const enriched: Profile[] = (data as any[]).map(p => ({
          ...p,
          listing_count: countMap.get(p.id) || 0,
        }));
        setProfiles(enriched);
        const countrySet = new Set<string>();
        const deptSet = new Set<string>();
        enriched.forEach(p => {
          if (p.country) countrySet.add(p.country);
          if (p.department) deptSet.add(p.department);
        });
        setCountries(Array.from(countrySet).sort());
        setDepartments(Array.from(deptSet).sort());
      }
      setLoading(false);
    }
    load();
  }, []);

  // Fetch liked agents for current user
  useEffect(() => {
    if (!currentProfileId) return;
    async function loadLikes() {
      const { data } = await supabase
        .from('agent_likes')
        .select('agent_id')
        .eq('user_id', currentProfileId);
      setLikedAgents(new Set((data || []).map(l => l.agent_id)));
    }
    loadLikes();
  }, [currentProfileId]);

  const toggleLike = async (agentId: string) => {
    if (!currentProfileId) return;
    const alreadyLiked = likedAgents.has(agentId);
    // Optimistic update
    setLikedAgents(prev => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(agentId) : next.add(agentId);
      return next;
    });
    setProfiles(prev => prev.map(p => p.id === agentId ? { ...p, likes_count: (p.likes_count || 0) + (alreadyLiked ? -1 : 1) } : p));

    try {
      if (alreadyLiked) {
        await supabase.from('agent_likes').delete().match({ user_id: currentProfileId, agent_id: agentId });
      } else {
        await supabase.from('agent_likes').insert({ user_id: currentProfileId, agent_id: agentId });
      }
    } catch (error) {
      // revert on error
      setLikedAgents(prev => {
        const next = new Set(prev);
        alreadyLiked ? next.add(agentId) : next.delete(agentId);
        return next;
      });
      setProfiles(prev => prev.map(p => p.id === agentId ? { ...p, likes_count: (p.likes_count || 0) + (alreadyLiked ? 1 : -1) } : p));
    }
  };

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      if (selectedCountry && p.country !== selectedCountry) return false;
      if (selectedDepartment && p.department !== selectedDepartment) return false;
      return true;
    });
  }, [profiles, selectedCountry, selectedDepartment]);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-[1001] border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">Uplat</Link>
          <div className="flex items-center gap-4">
            <Link href="/agents" className="text-sm font-medium text-blue-600">Agentes</Link>
            <LanguageSwitch current="es" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Directorio de Agentes</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <select
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            value={selectedCountry}
            onChange={e => {
              setSelectedCountry(e.target.value);
              setSelectedDepartment('');
            }}
          >
            <option value="">Todos los países</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            disabled={!selectedCountry}
          >
            <option value="">Todos los departamentos</option>
            {Array.from(new Set(
              profiles
                .filter(p => !selectedCountry || p.country === selectedCountry)
                .map(p => p.department)
                .filter((d): d is string => !!d)
            )).sort().map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-zinc-600">Cargando agentes...</p>
        ) : filtered.length === 0 ? (
          <p className="text-zinc-600">No se encontraron agentes.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(agent => (
              <div key={agent.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={agent.avatar_url || 'https://via.placeholder.com/64?text=AG'}
                    alt={agent.full_name || 'Agent'}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">{agent.full_name}</div>
                    <div className="text-xs text-zinc-500">{agent.city}, {agent.country}</div>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 mb-2">
                  {agent.bio || 'Sin biografía.'}
                </p>
                <div className="text-xs text-zinc-500 mb-3">
                  {agent.listing_count || 0} propiedades
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${likedAgents.has(agent.id) ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                    onClick={() => toggleLike(agent.id)}
                    disabled={!currentProfileId}
                  >
                    ❤️ {agent.likes_count || 0}
                  </button>
                  <button className="rounded bg-blue-600 py-1 px-3 text-sm font-medium text-white hover:bg-blue-700">
                    Ver perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}