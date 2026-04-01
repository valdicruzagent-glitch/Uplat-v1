'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from "@/lib/supabaseClient";
const supabase = createSupabaseClient();

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
  const [phoneReadonly, setPhoneReadonly] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<{ phone?: string; terms_accepted?: boolean; role?: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const logged = !!user;
      setIsLoggedIn(logged);
      if (logged && user) {
        const { data } = await supabase.from('profiles').select('phone, terms_accepted, role').eq('id', user.id).single();
        setProfile(data);
        if (data?.phone) {
          setWaFrom(data.phone);
          setPhoneReadonly(true);
        }
        if (data && (!data.phone || !data.terms_accepted || !data.role)) {
          router.push('/onboarding');
        }
      } else {
        setProfile(null);
      }
      setAuthChecked(true);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const logged = !!session;
      setIsLoggedIn(logged);
      if (logged && session?.user) {
        supabase.from('profiles').select('phone, terms_accepted, role').eq('id', session.user.id).single()
          .then(({ data }) => {
            setProfile(data);
            if (data?.phone) {
              setWaFrom(data.phone);
              setPhoneReadonly(true);
            }
            if (data && (!data.phone || !data.terms_accepted || !data.role)) {
              router.push('/onboarding');
            }
          });
      } else {
        setProfile(null);
      }
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

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
      // If phone is readonly, we keep it; otherwise clear field
      if (!phoneReadonly) setWaFrom('');
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

  // If logged in but profile incomplete (should be caught by middleware), as fallback redirect
  if (profile && (!profile.phone || !profile.terms_accepted || !profile.role)) {
    // Redirect already issued in effect; render nothing to avoid flash
    return null;
  }

  // Show inquiry form
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
        {phoneReadonly ? (
          <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800">
            {waFrom}
          </div>
        ) : (
          <input
            type="tel"
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            value={waFrom}
            onChange={e => setWaFrom(e.target.value)}
            placeholder="+1 234 567 8900"
          />
        )}
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
