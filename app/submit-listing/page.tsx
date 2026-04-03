'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import SiteHeader from "@/app/components/SiteHeader";
import SubmitListingForm from "@/app/submit-listing/submitListingForm";
import { es } from "@/app/i18n/es";

export default function SubmitListingPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[SubmitListingPage] getUser() ->', { user });
      if (!user) {
        router.replace("/signin?next=/submit-listing");
      }
    };
    checkAuth();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const user = session?.user ?? null;
      console.log('[SubmitListingPage] onAuthStateChange ->', { user });
      if (!user) router.replace("/signin?next=/submit-listing");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // You could show a loading state here; for now we render
  return (
    <>
      <SiteHeader locale="es" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{es.submitListingTitle}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{es.submitListingSubtitle}</p>
          </div>
          <SubmitListingForm locale="es" />
        </div>
      </main>
    </>
  );
}
