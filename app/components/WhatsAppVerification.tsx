'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/lib/supabaseClient";

const supabase = getSupabaseClient();

interface WhatsAppVerificationProps {
  onVerified?: () => void;
  locale: 'es' | 'en';
  translations: {
    title: string;
    description: string;
    phonePlaceholder: string;
    sendCode: string;
    sending: string;
    codePlaceholder: string;
    verifyCode: string;
    verifying: string;
    success?: string;
    error?: string;
    verifiedBadge: string;
    resendCode: string;
  };
}

export default function WhatsAppVerification({ onVerified, locale, translations }: WhatsAppVerificationProps) {
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [verified, setVerified] = useState(false);

  // Check current profile status on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('whatsapp_verified')
          .eq('id', data.user.id)
          .single();
        if (profile?.whatsapp_verified) {
          setVerified(true);
          setStep('done');
          onVerified?.();
        }
      }
    });
  }, [onVerified]);

  const sendCode = async () => {
    if (!phone.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/verify/whatsapp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send code');
      setStep('code');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/verify/whatsapp/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Verification failed');
      setVerified(true);
      setStep('done');
      onVerified?.();
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  if (verified) {
    return (
      <div className="p-3 border rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-sm">
        {translations.verifiedBadge}
      </div>
    );
  }

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900">
      {step === 'phone' && (
        <>
          <p className="text-sm">{translations.description}</p>
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
          <p className="text-sm">{translations.description} Enter code sent to {phone}.</p>
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

      {status === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
    </div>
  );
}