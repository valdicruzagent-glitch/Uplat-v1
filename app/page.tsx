'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageSwitch from "@/app/components/LanguageSwitch";
import MapSection from "@/app/components/MapSection";
import { es } from "@/app/i18n/es";
import { loadGuestState, saveGuestState } from "@/lib/guestState";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const t = es;
  const guestState = loadGuestState();
  const [center, setCenter] = useState<[number, number] | null>(
    guestState.mapCenter ? [guestState.mapCenter.lat, guestState.mapCenter.lng] : null
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Real auth state: only set user if onboarding complete
  useEffect(() => {
    const setAuthUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUser(null);
        return;
      }
      // Check profile completion
      const { data: profile } = await supabase.from('profiles').select('whatsapp_number, terms_accepted, role').eq('id', user.id).single();
      const isComplete = profile?.whatsapp_number && profile?.terms_accepted && profile?.role;
      if (isComplete) {
        setUser({ name: user.user_metadata?.full_name || user.email?.split('@')[0] || '' });
      } else {
        setUser(null); // incomplete -> treat as guest for header
      }
    };
    setAuthUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('whatsapp_number, terms_accepted, role').eq('id', session.user.id).single();
      const isComplete = profile?.whatsapp_number && profile?.terms_accepted && profile?.role;
      if (isComplete) {
        setUser({ name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '' });
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (center) {
      saveGuestState({ mapCenter: { lat: center[0], lng: center[1] } });
    }
  }, [center]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileOpen]);

  const handleSell = () => {
    window.location.href = '/signin?next=/sell';
  };

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-[1001] border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Left: burger (mobile only) */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          {/* Center brand */}
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight">Tualero</div>

          {/* Right: mobile auth button */}
          {user ? (
            <div className="md:hidden text-sm font-medium text-zinc-900 dark:text-zinc-50">{user.name}</div>
          ) : (
            <Link href="/signin" className="md:hidden px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700">Entrar</Link>
          )}

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/agents" className="text-sm font-medium">{t.findAgent}</Link>
            <button onClick={handleSell} className="text-sm font-medium">{t.sell}</button>
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setHelpOpen(true)} className="text-sm font-medium">{t.getHelp}</button>
            <LanguageSwitch current="es" />
            {user ? (
              <div className="relative">
                <button className="text-sm font-medium" onClick={() => setMenuOpen(o => !o)}>
                  {user.name}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border rounded-lg shadow-lg z-50">
                    <Link href="/user-settings" className="block px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>Profile</Link>
                    <Link href="/dashboard" className="block px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => { supabase.auth.signOut(); setMenuOpen(false); }}>Log out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/signin" className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700">{t.signInTitle}</Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-40 bg-zinc-950/95 p-6 md:hidden overflow-y-auto">
          <button className="absolute top-4 right-4" onClick={() => setMobileOpen(false)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="mt-16 flex flex-col gap-6">
            <button onClick={() => { handleSell(); setMobileOpen(false); }} className="flex items-center gap-3 text-lg font-medium text-zinc-50 transition-colors hover:text-zinc-300">
              <span>→</span> {t.sell}
            </button>
            <Link href="/agents" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-lg font-medium text-zinc-50 transition-colors hover:text-zinc-300">
              <span>→</span> {t.findAgent}
            </Link>
            <button onClick={() => { setHelpOpen(true); setMobileOpen(false); }} className="flex items-center gap-3 text-lg font-medium text-zinc-50 transition-colors hover:text-zinc-300">
              <span>→</span> {t.getHelp}
            </button>
            {user && (
              <>
                <Link href="/user-settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-lg font-medium text-zinc-50 transition-colors hover:text-zinc-300">
                  <span>→</span> Profile
                </Link>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-lg font-medium text-zinc-50 transition-colors hover:text-zinc-300">
                  <span>→</span> Dashboard
                </Link>
                <button onClick={() => { supabase.auth.signOut(); setMobileOpen(false); }} className="flex items-center gap-3 text-lg font-medium text-zinc-50 transition-colors hover:text-zinc-300">
                  <span>→</span> Log out
                </button>
              </>
            )}
          </div>
          <div className="mt-12 flex justify-center gap-6 text-base">
            <Link href="/" className="text-blue-400 font-medium">{t.langEs}</Link>
            <span className="text-zinc-600">/</span>
            <Link href="/en" className="text-zinc-400 hover:text-zinc-200">{t.langEn}</Link>
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10">
        <MapSection locale="es" basePath="" center={center} onCenterChange={setCenter} />
      </main>

      {agentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setAgentsOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-2">{t.agentModalTitle}</h2>
            <p className="text-zinc-600 dark:text-zinc-300">{t.agentModalBody}</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setAgentsOpen(false)}>{t.close}</button>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-2">{t.helpModalTitle}</h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-2">{t.helpModalEmail} <a href="mailto:support@tualero.app" className="text-blue-600 hover:underline">support@tualero.app</a></p>
            <p className="text-sm text-zinc-400">{t.helpModalSub}</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setHelpOpen(false)}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}
