'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InquiryFormProps {
  listingId: string;
  agentId: string | null | undefined;
  locale: 'es' | 'en';
  translations: {
    askAbout: string;
    messagePlaceholder: string;
    waPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    signInToInquire: string;
    signInButton: string;
  };
}

export default function InquiryForm({ listingId, agentId, locale, translations }: InquiryFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [waFrom, setWaFrom] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const logged = !!data.user;
      setIsLoggedIn(logged);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const ensureProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not authenticated' };
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!isLoggedIn) {
      router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Ensure profile exists
    const profileResult = await ensureProfile();
    if (!profileResult.ok) {
      setErrorMsg(profileResult.error || 'Auth error');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');
    try {
      const { error } = await supabase.from('listing_inquiries').insert({
        listing_id: listingId,
        user_id: (await supabase.auth.getUser()).data.user?.id || null,
        agent_id: agentId || null,
        message: message.trim(),
        wa_from: waFrom.trim() || null,
        status: 'new',
      });
      if (error) throw error;
      setStatus('success');
      setMessage('');
      setWaFrom('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send inquiry');
      setStatus('error');
    }
  };

  if (!authChecked) return <p className="text-sm">Loading...</p>;

  if (!isLoggedIn) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
        <p className="text-sm mb-2">{translations.signInToInquire}</p>
        <button
          onClick={() => router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`) }
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {translations.signInButton}
        </button>
      </div>
    );
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1">{translations.messagePlaceholder}</label>
        <textarea
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{translations.waPlaceholder}</label>
        <input
          type="tel"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          value={waFrom}
          onChange={e => setWaFrom(e.target.value)}
          placeholder="+1 234 567 8900"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={status === 'submitting' || !message.trim()}
      >
        {status === 'submitting' ? translations.submitting : translations.submit}
      </button>
      {status === 'success' && <p className="text-sm text-green-600">{translations.success}</p>}
      {status === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
    </form>
  );
}