'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OnboardingProps {
  locale: 'es' | 'en';
  translations: {
    title: string;
    stepPhoneTitle: string;
    stepPhoneDesc: string;
    phonePlaceholder: string;
    sendCode: string;
    sending: string;
    stepCodeTitle: string;
    codePlaceholder: string;
    verifyCode: string;
    verifying: string;
    stepRoleTitle: string;
    roleUser: string;
    roleRealtor: string;
    roleAgency: string;
    finish: string;
    finishing: string;
    verifiedBadge: string;
    resendCode: string;
    errorRequired: string;
    errorSend: string;
    errorVerify: string;
    errorSaveProfile: string;
  };
}

type Step = 'phone' | 'code' | 'role' | 'done';

export default function OnboardingClient({ locale, translations }: OnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [role, setRole] = useState<'user' | 'realtor' | 'agency' | null>(null);

  // Ensure user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/signin?redirect=${encodeURIComponent('/onboarding')}`);
      }
    };
    checkAuth();
  }, [router]);

  // If role is selected, complete onboarding
  useEffect(() => {
    if (role) {
      completeOnboarding();
    }
  }, [role]);

  const sendCode = async () => {
    if (!phone.trim()) {
      setErrorMsg(translations.errorRequired);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/verify/whatsapp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || translations.errorSend);
      setStep('code');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setErrorMsg(translations.errorRequired);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/verify/whatsapp/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || translations.errorVerify);
      // Verification succeeded; now wait for role selection
      setStep('role');
      setStatus('idle');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const completeOnboarding = async () => {
    setStatus('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert profile with full_name (from user metadata), role, and WhatsApp verification
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
        role,
        whatsapp_number: phone.trim(),
        whatsapp_verified: true,
        whatsapp_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      setStep('done');
      setStatus('idle');

      // Redirect after brief delay
      setTimeout(() => {
        if (role === 'user') router.push('/');
        else if (role === 'realtor') router.push('/agents');
        else if (role === 'agency') router.push('/'); // temporary; agencies page pending
      }, 500);
    } catch (err: any) {
      setErrorMsg(translations.errorSaveProfile);
      setStatus('error');
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-black p-6">
        <div className="max-w-md w-full space-y-4">
          <div className="p-4 border rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {translations.verifiedBadge}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {locale === 'es' ? 'Redirigiendo...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-black p-6">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">{translations.title}</h1>

        {step === 'phone' && (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{translations.stepPhoneDesc}</p>
            <input
              type="tel"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              placeholder={translations.phonePlaceholder}
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <button
              className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={sendCode}
              disabled={status === 'loading' || !phone.trim()}
            >
              {status === 'loading' ? translations.sending : translations.sendCode}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{translations.stepCodeTitle} {phone}</p>
            <input
              type="text"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              placeholder={translations.codePlaceholder}
              value={code}
              onChange={e => setCode(e.target.value)}
            />
            <button
              className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={verifyCode}
              disabled={status === 'loading' || !code.trim()}
            >
              {status === 'loading' ? translations.verifying : translations.verifyCode}
            </button>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => { setStep('phone'); setCode(''); }}
            >
              {translations.resendCode}
            </button>
          </>
        )}

        {step === 'role' && (
          <>
            <p className="text-sm font-medium">{translations.stepRoleTitle}</p>
            <div className="space-y-2">
              <button
                className="w-full rounded border p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setRole('user')}
              >
                {translations.roleUser}
              </button>
              <button
                className="w-full rounded border p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setRole('realtor')}
              >
                {translations.roleRealtor}
              </button>
              <button
                className="w-full rounded border p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setRole('agency')}
              >
                {translations.roleAgency}
              </button>
            </div>
          </>
        )}

        {status === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
      </div>
    </div>
  );
}
