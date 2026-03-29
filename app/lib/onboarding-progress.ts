import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Step = 'phone' | 'code' | 'terms' | 'role';

/**
 * Ensures a minimal profile row exists for the current user.
 * Used at the start of onboarding to guarantee a record for updates.
 */
export async function ensureProfileExists(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to insert a minimal profile; ignore duplicate key error
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
    role: null,
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
 * Gets the current onboarding progress from the profiles table.
 * Returns the step the user should be on: 'phone' | 'code' | 'terms' | 'role'
 * Also returns phone number if available (for code step prefill).
 * If profile.role is set, returns { step: 'role' } indicating completion.
 */
export async function getOnboardingProgress(): Promise<{ step: Step; phone?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { step: 'phone' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('whatsapp_verified, terms_accepted, role, whatsapp_number')
    .eq('id', user.id)
    .single();

  if (!profile) return { step: 'phone' };

  if (profile.role) return { step: 'role' };
  if (profile.terms_accepted) return { step: 'role' }; // terms done, need role selection
  if (profile.whatsapp_verified) return { step: 'terms' };
  if (profile.whatsapp_number) return { step: 'code', phone: profile.whatsapp_number };
  return { step: 'phone' };
}
