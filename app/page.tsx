'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageSwitch from "@/app/components/LanguageSwitch";
import MapSection from "@/app/components/MapSection";
import { es } from "@/app/i18n/es";
import { loadGuestState, saveGuestState } from "@/lib/guestState";

export default function Home() {
  const t = es;
  const guestState = loadGuestState();
  const [center, setCenter] = useState<[number, number] | null>(
    guestState.mapCenter ? [guestState.mapCenter.lat, guestState.mapCenter.lng] : null
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

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
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium">{t.buy}</Link>
            <Link href="/" className="text-sm font-medium">{t.rent}</Link>
            <button onClick={handleSell} className="text-sm font-medium">{t.sell}</button>
            <button onClick={() => setAgentsOpen(true)} className="text-sm font-medium">{t.findAgent}</button>
          </nav>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight">Uplat</div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setHelpOpen(true)} className="text-sm font-medium">{t.getHelp}</button>
            <LanguageSwitch current="es" />
            <Link href="/signin" className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700">{t.signInTitle}</Link>
          </div>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-zinc-950 dark:bg-zinc-950 p-6 md:hidden">
            <button className="absolute top-4 right-4" onClick={() => setMobileOpen(false)}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mt-12 flex flex-col gap-4">
              <Link href="/" className="text-base font-medium text-zinc-50" onClick={() => setMobileOpen(false)}>{t.buy}</Link>
              <Link href="/" className="text-base font-medium text-zinc-50" onClick={() => setMobileOpen(false)}>{t.rent}</Link>
              <button onClick={() => { handleSell(); setMobileOpen(false); }} className="text-base font-medium text-left text-zinc-50">{t.sell}</button>
              <button onClick={() => { setAgentsOpen(true); setMobileOpen(false); }} className="text-base font-medium text-left text-zinc-50">{t.findAgent}</button>
              <button onClick={() => { setHelpOpen(true); setMobileOpen(false); }} className="text-base font-medium text-left text-zinc-50">{t.getHelp}</button>
              <Link href="/signin" className="mt-4 inline-flex justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded" onClick={() => setMobileOpen(false)}>{t.signInTitle}</Link>
            </div>
          </div>
        )}
      </header>

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
            <p className="text-zinc-600 dark:text-zinc-300 mb-2">{t.helpModalEmail} <a href="mailto:support@uplat.app" className="text-blue-600 hover:underline">support@uplat.app</a></p>
            <p className="text-sm text-zinc-400">{t.helpModalSub}</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setHelpOpen(false)}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}
