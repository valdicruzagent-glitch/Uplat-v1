import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Step = 'phone' | 'terms' | 'role';

/**
 * Ensures a minimal profile row exists for the current user.
 */
export async function ensureProfileExists(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
    role: null,
    whatsapp_number: null,
    whatsapp_verified: false,
    terms_accepted: false,
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
    .select('role, terms_accepted, whatsapp_number')
    .eq('id', user.id)
    .single();

  if (!profile) return { step: 'phone' };

  if (profile.role) return { step: 'role' };
  if (profile.terms_accepted) return { step: 'role' };
  if (profile.whatsapp_number) return { step: 'terms', phone: profile.whatsapp_number };
  return { step: 'phone' };
}
