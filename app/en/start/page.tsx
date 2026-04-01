'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSwitch from "@/app/components/LanguageSwitch";
import { en } from "@/app/i18n/en";
import StartChoice from "@/app/start/startChoice";
import { getSupabaseClient } from "@/lib/supabaseClient";

const supabase = getSupabaseClient();

export default function StartPageEn() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('phone, terms_accepted, role').eq('id', user.id).maybeSingle();
      const isComplete = profile?.phone && profile?.terms_accepted && profile?.role;
      if (!isComplete) {
        router.replace('/onboarding');
      } else {
        if (profile?.role === 'user') router.replace('/');
        else router.replace('/user-settings');
      }
    };
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

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
