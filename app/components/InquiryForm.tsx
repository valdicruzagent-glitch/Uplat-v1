'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import WhatsAppVerification from './WhatsAppVerification';

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
    // WhatsApp verification
    waVerifyTitle: string;
    waVerifyDesc: string;
    waPhonePlaceholder: string;
    waSendCode: string;
    waSending: string;
    waCodePlaceholder: string;
    waVerifyCode: string;
    waVerifying: string;
    waVerifiedBadge: string;
    waResendCode: string;
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
  const [profile, setProfile] = useState<{ whatsapp_verified?: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const logged = !!data.user;
      setIsLoggedIn(logged);
      if (logged) {
        supabase.from('profiles').select('whatsapp_verified').eq('id', data.user!.id).single()
          .then(({ data }) => setProfile(data || null));
      }
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const logged = !!session;
      setIsLoggedIn(logged);
      if (logged && session.user) {
        supabase.from('profiles').select('whatsapp_verified').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data || null));
      } else {
        setProfile(null);
      }
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

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

  // If logged in but WhatsApp not verified, show verification flow
  if (profile?.whatsapp_verified === false) {
    return (
      <div className="mt-4">
        <WhatsAppVerification
          locale={locale}
          translations={{
            title: translations.waVerifyTitle,
            description: translations.waVerifyDesc,
            phonePlaceholder: translations.waPhonePlaceholder,
            sendCode: translations.waSendCode,
            sending: translations.waSending,
            codePlaceholder: translations.waCodePlaceholder,
            verifyCode: translations.waVerifyCode,
            verifying: translations.waVerifying,
            verifiedBadge: translations.waVerifiedBadge,
            resendCode: translations.waResendCode,
          }}
          onVerified={() => {
            // Optionally refresh profile or show success then show form
            setProfile({ whatsapp_verified: true });
          }}
        />
      </div>
    );
  }

  // Verified: show inquiry form
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