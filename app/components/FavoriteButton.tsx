'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/lib/supabaseClient";

const supabase = getSupabaseClient();

interface Props {
  listingId: string;
  initialFavorited?: boolean;
  initialCount?: number;
}

export default function FavoriteButton({ listingId, initialFavorited = false, initialCount = 0 }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has favorited this listing
    fetch('/api/favorites')
      .then(r => {
        if (r.status === 401) {
          // Not logged in; treat as not favorited
          setFavorited(false);
          return [];
        }
        return r.json();
      })
      .then((ids: string[]) => {
        if (Array.isArray(ids)) {
          setFavorited(ids.includes(listingId));
        }
      })
      .catch(() => {});
  }, [listingId]);

  const toggle = async () => {
    // First, check local auth state
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      });
      if (res.status === 401) {
        window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const data = await res.json();
      if (data.action === 'added') {
        setFavorited(true);
        setCount(c => c + 1);
      } else if (data.action === 'deleted') {
        setFavorited(false);
        setCount(c => Math.max(0, c - 1));
      }
    } catch (e) {
      console.error('Favorite toggle failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-60"
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`h-5 w-5 ${favorited ? 'text-red-500 fill-current' : 'text-zinc-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span className={`text-sm font-medium ${favorited ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-300'}`}>{count}</span>
    </button>
  );
}
