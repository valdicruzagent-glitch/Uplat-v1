'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from "@/lib/supabaseClient";
import LanguageSwitch from "@/app/components/LanguageSwitch";
import { es } from '@/app/i18n/es';

const supabase = createSupabaseClient();

export default function UserSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Header/menu states
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = es;
  const user = profile ? { name: profile.full_name || profile.email, avatar_url: profile.avatar_url } : null;

  const handleSell = () => {
    window.location.href = '/signin?next=/sell';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/signin?redirect=${encodeURIComponent('/user-settings')}`);
          return;
        }
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (error) {
          console.error('Profile fetch error:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (e) {
        console.error('Unexpected error in /user-settings:', e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-[1001] border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Left: burger (mobile only) */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          {/* Center brand */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight">Tualero</Link>

          {/* Right: mobile auth button */}
          {user ? (
            <div className="md:hidden flex items-center gap-2">
              {user.avatar_url && (
                <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{user.name}</div>
            </div>
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
              <div className="relative" ref={menuRef}>
                <button className="text-sm font-medium flex items-center gap-2" onClick={() => setMenuOpen(o => !o)}>
                  {user.avatar_url && (
                    <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                  )}
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

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Perfil</h1>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
          <div>
            <div className="text-sm text-zinc-500">Nombre</div>
            <div className="font-medium">{profile?.full_name || '(sin nombre)'}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Correo electrónico</div>
            <div className="font-medium">{profile?.email || ''}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Rol</div>
            <div className="font-medium capitalize">{profile?.role}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Teléfono</div>
            <div className="font-medium">{profile?.phone || '(no registrado)'}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Términos aceptados</div>
            <div className="font-medium">{profile?.terms_accepted ? 'Sí' : 'No'}</div>
          </div>
        </div>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Campos adicionales (biografía, ubicación, foto de perfil) estarán disponibles próximamente.
        </p>
      </main>
    </div>
  );
}