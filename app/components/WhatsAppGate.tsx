'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from "@/lib/supabaseClient";
import WhatsAppVerification from './WhatsAppVerification';

const supabase = createSupabaseClient();

interface WhatsAppGateProps {
  children: React.ReactNode;
  locale: 'es' | 'en';
  translations: {
    signInPrompt: string;
    signInButton: string;
    verifyPrompt: string;
    verifyButton: string;
    // WhatsApp verification UI
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

export default function WhatsAppGate({ children, locale, translations }: WhatsAppGateProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<{ whatsapp_verified?: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const logged = !!data.user;
      setIsLoggedIn(logged);
      if (logged && data.user) {
        supabase.from('profiles').select('whatsapp_verified').eq('id', data.user.id).single()
          .then(({ data }) => setProfile(data || null));
      }
      setChecked(true);
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
      setChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!checked) return <p className="text-sm">Loading...</p>;

  if (!isLoggedIn) {
    return (
      <div className="p-6 border rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
        <p className="text-sm mb-3">{translations.signInPrompt}</p>
        <button
          onClick={() => router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {translations.signInButton}
        </button>
      </div>
    );
  }

  if (profile?.whatsapp_verified === false) {
    return (
      <div className="border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900">
        <p className="text-sm mb-3">{translations.verifyPrompt}</p>
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
            // Refresh profile state to reveal children
            supabase.from('profiles').select('whatsapp_verified').eq('id', supabase.auth.getSession().then(({ data }) => data.session?.user?.id)).single()
              .then(({ data }) => setProfile(data || null));
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}