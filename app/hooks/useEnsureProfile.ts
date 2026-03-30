'use client';

import { useCallback } from 'react';
import { getSupabaseClient } from "@/lib/supabaseClient";

const supabase = getSupabaseClient();

export function useEnsureProfile() {
  const ensureProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not authenticated' };
    // Try to insert minimal profile; ignore duplicate key error
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: 'user',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
      });
    if (error && error.code !== '23505') {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }, []);

  return { ensureProfile };
}