import { getSupabaseClient } from "@/lib/supabaseClient";

const supabase = getSupabaseClient();

export type Step = 'phone' | 'terms' | 'role';

/**
 * Ensures a minimal profile row exists for the current user.
 */
export async function ensureProfileExists(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
  });
  if (error && error.code !== '23505') {
    console.error('Failed to ensure profile:', error.message);
    return null;
  }
  return user.id;
}

/**
 * Gets the current onboarding progress.
 * Flow: phone → terms → role.
 * Returns the step the user should be on.
 */
export async function getOnboardingProgress(): Promise<{ step: Step; phone?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { step: 'phone' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, terms_accepted, phone')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return { step: 'phone' };

  if (profile.role) return { step: 'role' };
  if (profile.terms_accepted) return { step: 'role' };
  if (profile.phone) return { step: 'terms', phone: profile.phone };
  return { step: 'phone' };
}
