'use client';

import { useState } from 'react';
import Link from 'next/link';
import LanguageSwitch from "@/app/components/LanguageSwitch";
import MapSection from "@/app/components/MapSection";
import UseMyLocationButton from "@/app/components/UseMyLocationButton";
import { es } from "@/app/i18n/es";

export default function Home() {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleSell = () => {
    // For now, redirect to sign in. After login, continue to /sell
    window.location.href = '/signin?next=/sell';
  };

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Left nav – desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium">Comprar</Link>
            <Link href="/" className="text-sm font-medium">Rentar</Link>
            <button onClick={handleSell} className="text-sm font-medium">Sell</button>
            <button onClick={() => setAgentsOpen(true)} className="text-sm font-medium">Encuentra un agente</button>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          {/* Center logo */}
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight">Uplat</div>

          {/* Right nav – desktop */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setHelpOpen(true)} className="text-sm font-medium">Obtén ayuda</button>
            <LanguageSwitch current="es" />
            <Link href="/signin" className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700">Sign in</Link>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 p-6 md:hidden">
            <button className="absolute top-4 right-4" onClick={() => setMobileOpen(false)}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mt-12 flex flex-col gap-4">
              <Link href="/" className="text-base font-medium" onClick={() => setMobileOpen(false)}>Comprar</Link>
              <Link href="/" className="text-base font-medium" onClick={() => setMobileOpen(false)}>Rentar</Link>
              <button onClick={() => { handleSell(); setMobileOpen(false); }} className="text-base font-medium text-left">Sell</button>
              <button onClick={() => { setAgentsOpen(true); setMobileOpen(false); }} className="text-base font-medium text-left">Encuentra un agente</button>
              <button onClick={() => { setHelpOpen(true); setMobileOpen(false); }} className="text-base font-medium text-left">Obtén ayuda</button>
              <Link href="/signin" className="mt-4 inline-flex justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded" onClick={() => setMobileOpen(false)}>Sign in</Link>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10">
        <MapSection locale="es" basePath="" center={center} />
      </main>

      {/* Modals */}
      {agentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setAgentsOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-2">Encuentra un agente</h2>
            <p className="text-zinc-600 dark:text-zinc-300">Esta función estará disponible pronto. Estamos construyendo una red de agentes confianza para ayudarte.</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setAgentsOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-2">Obtén ayuda</h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-2">Escríbenos a <a href="mailto:support@uplat.app" className="text-blue-600 hover:underline">support@uplat.app</a></p>
            <p className="text-sm text-zinc-400">Te responderemos pronto.</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setHelpOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
