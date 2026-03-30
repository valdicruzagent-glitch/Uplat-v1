'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Profile } from '@/app/types/profile';
import LanguageSwitch from '@/app/components/LanguageSwitch';
import { useEnsureProfile } from '@/app/hooks/useEnsureProfile';

const supabase = getSupabaseClient();

export default function AgentsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [likedAgents, setLikedAgents] = useState<Set<string>>(new Set());
  const [reviewModalAgent, setReviewModalAgent] = useState<Profile | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const router = useRouter();
  const { ensureProfile } = useEnsureProfile();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setCurrentProfileId(data.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentProfileId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch all realtors with counts
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
          likes_count,
          agency_id,
          agencies (name, is_verified, status_tier)
        `)
        .eq('role', 'realtor');

      if (!error && data) {
        const ids = (data as any[]).map(p => p.id);
        // listing counts
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
        // reviews aggregates
        const { data: reviewsData } = await supabase
          .from('agent_reviews')
          .select('agent_id, rating')
          .in('agent_id', ids);
        const reviewCountMap = new Map<string, number>();
        const ratingSumMap = new Map<string, number>();
        reviewsData?.forEach((r: any) => {
          const aid = r.agent_id as string;
          reviewCountMap.set(aid, (reviewCountMap.get(aid) || 0) + 1);
          ratingSumMap.set(aid, (ratingSumMap.get(aid) || 0) + r.rating);
        });

        const enriched: Profile[] = (data as any[]).map(p => ({
          ...p,
          listing_count: countMap.get(p.id) || 0,
          review_count: reviewCountMap.get(p.id) || 0,
          average_rating: ratingSumMap.has(p.id)
            ? Number((ratingSumMap.get(p.id)! / reviewCountMap.get(p.id)!).toFixed(2))
            : 0,
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

  // Fetch liked agents
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
    if (!currentProfileId) {
      router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // Ensure profile exists for FK
    await ensureProfile();

    const alreadyLiked = likedAgents.has(agentId);
    setLikedAgents(prev => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(agentId) : next.add(agentId);
      return next;
    });
    setProfiles(prev => prev.map(p => p.id === agentId ? { ...p, likes_count: (p.likes_count || 0) + (alreadyLiked ? -1 : 1) } : p));
    try {
      if (alreadyLiked) await supabase.from('agent_likes').delete().match({ user_id: currentProfileId, agent_id: agentId });
      else await supabase.from('agent_likes').insert({ user_id: currentProfileId, agent_id: agentId });
    } catch (error) {
      setLikedAgents(prev => {
        const next = new Set(prev);
        alreadyLiked ? next.add(agentId) : next.delete(agentId);
        return next;
      });
      setProfiles(prev => prev.map(p => p.id === agentId ? { ...p, likes_count: (p.likes_count || 0) + (alreadyLiked ? 1 : -1) } : p));
    }
  };

  const openReviewModal = (agent: Profile) => {
    if (!currentProfileId) {
      router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // Ensure profile exists before opening
    ensureProfile().catch(() => {});
    setReviewModalAgent(agent);
    setReviewRating(0);
    setReviewText('');
  };

  const closeReviewModal = () => {
    setReviewModalAgent(null);
    setReviewRating(0);
    setReviewText('');
  };

  const submitReview = async () => {
    if (!currentProfileId || !reviewModalAgent || reviewRating === 0) return;
    // Ensure profile exists for FK
    await ensureProfile();
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('agent_reviews').upsert({
        agent_id: reviewModalAgent.id,
        user_id: currentProfileId,
        rating: reviewRating,
        text: reviewText.trim() || null,
      }, { onConflict: 'agent_id,user_id' });
      if (!error) {
        // Refresh aggregates locally
        setProfiles(prev => prev.map(p => {
          if (p.id !== reviewModalAgent.id) return p;
          const oldCount = p.review_count || 0;
          const oldAvg = p.average_rating || 0;
          const newCount = oldCount + 1;
          const newAvg = Number(((oldAvg * oldCount + reviewRating) / newCount).toFixed(2));
          return { ...p, review_count: newCount, average_rating: newAvg };
        }));
        closeReviewModal();
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = useMemo(() => {
    let arr = profiles.filter(p => {
      if (selectedCountry && p.country !== selectedCountry) return false;
      if (selectedDepartment && p.department !== selectedDepartment) return false;
      return true;
    });

    // Weighted ranking score
    const weights = { rating: 0.5, likes: 0.3, listings: 0.2 };
    const rank = (p: Profile) =>
      ((p.average_rating ?? 0) * Math.log10((p.review_count ?? 0) + 1) * weights.rating) +
      ((p.likes_count ?? 0) * weights.likes) +
      ((p.listing_count ?? 0) * weights.listings);

    return arr.sort((a, b) => rank(b) - rank(a));
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
                <div className="text-xs text-zinc-500 mb-1">
                  {agent.listing_count || 0} propiedades
                </div>
                {/* Agency badges */}
                {agent.agencies && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-zinc-500">{agent.agencies.name}</span>
                    {agent.agencies.is_verified && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">✓ Verified</span>
                    )}
                    {agent.agencies.status_tier && agent.agencies.status_tier !== 'standard' && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                        agent.agencies.status_tier === 'silver' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' :
                        agent.agencies.status_tier === 'gold' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      }`}>
                        {agent.agencies.status_tier}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-zinc-500">
                    ⭐ {(agent.average_rating || 0).toFixed(1)} ({agent.review_count || 0} reseñas)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${likedAgents.has(agent.id) ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                    onClick={() => toggleLike(agent.id)}
                    disabled={!currentProfileId}
                  >
                    ❤️ {agent.likes_count || 0}
                  </button>
                  <button
                    className="rounded bg-blue-600 py-1 px-3 text-sm font-medium text-white hover:bg-blue-700"
                    onClick={() => openReviewModal(agent)}
                  >
                    Dejar reseña
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {reviewModalAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={closeReviewModal}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-2">Dejar reseña</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
              Escribe una reseña para <span className="font-medium">{reviewModalAgent.full_name}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Valoración</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-zinc-300'}`}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Comentario (opcional)</label>
              <textarea
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                rows={3}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Tu experiencia con este agente..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 text-sm rounded border border-zinc-300" onClick={closeReviewModal}>Cancelar</button>
              <button
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={submitReview}
                disabled={submittingReview || reviewRating === 0}
              >
                {submittingReview ? 'Enviando...' : 'Enviar reseña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}