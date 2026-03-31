"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { es } from "@/app/i18n/es";
import { en } from "@/app/i18n/en";
import LanguageSwitch from "./LanguageSwitch";

export default function SiteHeader({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;
  const pathname = usePathname();
  const supabase = getSupabaseClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async (user: any) => {
      if (!user) {
        if (mounted) setProfile(null);
        return;
      }
      const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle();
      if (mounted) setProfile(data ?? null);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadProfile(u);
      else setProfile(null);
      setLoading(false);
    });
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadProfile(u);
      else setProfile(null);
      setLoading(false);
    });
    return () => {
      subscription.unsubscribe();
      mounted = false;
    };
  }, [supabase]);

  const handleSell = () => {
    if (user && (profile || user.email)) {
      window.location.href = locale === "en" ? "/en/submit-listing" : "/submit-listing";
    } else {
      window.location.href = locale === "en" ? "/en/signin?next=/submit-listing" : "/signin?next=/submit-listing";
    }
  };

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Avatar fallback: profile.avatar_url -> user.user_metadata.avatar_url -> user.user_metadata.picture
  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  return (
    <>
      <header className="sticky top-0 z-[1001] border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Left: burger (mobile only) */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          {/* Center brand */}
          <Link href={locale === "en" ? "/en" : "/"} className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Tualero
          </Link>

          {/* Right: mobile auth button */}
          {user ? (
            <div className="md:hidden flex items-center gap-2">
              {avatarUrl && (
                <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''}</div>
            </div>
          ) : (
            <Link href={locale === "en" ? "/en/signin" : "/signin"} className="md:hidden px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700">
              {t.signInTitle}
            </Link>
          )}

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href={locale === "en" ? "/en/agents" : "/agents"} className={`text-sm font-medium ${isCurrent(locale === "en" ? "/en/agents" : "/agents") ? "text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400"}`}>
              {t.findAgent}
            </Link>
            <button onClick={handleSell} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400">
              {t.sell}
            </button>
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setHelpOpen(true)} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400">
              {t.getHelp}
            </button>
            <LanguageSwitch current={locale} />
            {!loading && (
              user ? (
                <div className="relative">
                  <button className="text-sm font-medium flex items-center gap-2 text-zinc-900 dark:text-zinc-100" onClick={() => setMenuOpen(m => !m)}>
                    {avatarUrl && (
                      <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                    )}
                    {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50">
                      <Link href={locale === "en" ? "/en/user-settings" : "/user-settings"} className="block px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>{t.profile ?? "Profile"}</Link>
                      <Link href={locale === "en" ? "/en/dashboard" : "/dashboard"} className="block px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>{t.dashboard ?? "Dashboard"}</Link>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => { supabase.auth.signOut(); setMenuOpen(false); }}>{t.logout ?? "Log out"}</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href={locale === "en" ? "/en/signin" : "/signin"} className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700">
                  {t.signInTitle}
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Help modal (placeholder) */}
      {helpOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50" onClick={() => setHelpOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">{t.helpTitle ?? "Help"}</h3>
            <p className="text-zinc-700 dark:text-zinc-300">{t.helpText ?? "Contact support."}</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setHelpOpen(false)}>{t.close ?? "Close"}</button>
          </div>
        </div>
      )}
    </>
  );
}
