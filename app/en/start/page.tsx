'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSwitch from "@/app/components/LanguageSwitch";
import { en } from "@/app/i18n/en";
import StartChoice from "@/app/start/startChoice";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StartPageEn() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('whatsapp_number, terms_accepted, role').eq('id', user.id).single();
      const isComplete = profile?.whatsapp_number && profile?.terms_accepted && profile?.role;
      if (!isComplete) {
        router.replace('/onboarding');
      } else {
        if (profile?.role === 'user') router.replace('/');
        else router.replace('/user-settings');
      }
    };
    check();
  }, [router]);

  return (
    <main className="min-h-dvh bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{en.startTitle}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{en.startSubtitle}</p>
          </div>
          <LanguageSwitch current="en" />
        </header>

        <StartChoice locale="en" />
      </div>
    </main>
  );
}
