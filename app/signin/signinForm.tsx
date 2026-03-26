"use client";

/**
 * Public onboarding / sign-in form for Uplat.
 *
 * What this file does:
 * - Makes the target V1 auth direction visible: Google first, WhatsApp verification next.
 * - Keeps a manual fallback so lead capture still works before full auth is finished.
 * - Stores light local context so publish flows can prefill contact data later.
 * - Creates a lightweight lead row in `realtor_leads` for manual-first operations.
 *
 * Safe edit note:
 * - The Google button can be wired before the WhatsApp verification backend is complete.
 * - Keep the fallback path alive until Twilio / verification code flows are production-ready.
 * - If the database role model changes, update the role union and insert payload together.
 */

import { useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import { getClientDeviceInfo } from "@/lib/deviceInfo";

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

function normalizeWhatsapp(input: string) {
  return input.replace(/\s+/g, "").replace(/^00/, "+");
}

function getSafeNextPath(locale: "es" | "en") {
  if (typeof window === "undefined") return locale === "en" ? "/en/start" : "/start";

  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return locale === "en" ? "/en/start" : "/start";
  if (!raw.startsWith("/")) return locale === "en" ? "/en/start" : "/start";
  if (raw.startsWith("//")) return locale === "en" ? "/en/start" : "/start";

  const allowed = ["/start", "/publish-role", "/submit-listing", "/en/start", "/en/publish-role", "/en/submit-listing"];
  if (!allowed.includes(raw)) return locale === "en" ? "/en/start" : "/start";

  const isEnglishPath = raw.startsWith("/en/");
  if (locale === "en" && !isEnglishPath) return "/en/start";
  if (locale === "es" && isEnglishPath) return "/start";

  return raw;
}

export default function SignInForm({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<"realtor" | "agency" | "seller" | "other">("realtor");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const nextPath = useMemo(() => getSafeNextPath(locale), [locale]);

  async function startGoogleSignIn() {
    setErr(null);
    setGoogleLoading(true);

    try {
      const supabase = getSupabaseClient();
      const redirectTo = `${window.location.origin}${nextPath}`;

      window.localStorage.setItem("uplat_auth_goal", "google_whatsapp");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function submitManualLead(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const wa = normalizeWhatsapp(whatsapp);
      if (!wa) throw new Error("WhatsApp is required");

      const device = getClientDeviceInfo();

      const { error } = await supabase.from("realtor_leads").insert({
        locale,
        whatsapp: wa,
        name: name || null,
        role,
        ...device,
      });

      if (error) throw error;

      // Store light identity context so later steps can prefill contact data
      // and route the user through the right publish path.
      window.localStorage.setItem("uplat_contact_whatsapp", wa);
      window.localStorage.setItem("uplat_contact_role", role);
      window.localStorage.setItem("uplat_auth_goal", "google_whatsapp");
      if (name) window.localStorage.setItem("uplat_contact_name", name);
      setDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>{t.thanks}</div>
        <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">{t.whatsappVerificationNext}</div>
        <div className="mt-3">
          <a
            className="inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href={nextPath}
          >
            {locale === "en" ? "Continue" : "Continuar"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </div>
      ) : null}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-semibold">{t.googlePrimaryTitle}</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.googlePrimarySubtitle}</div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <div className="font-medium">1. {t.googleStep}</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{t.googleStepHint}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <div className="font-medium">2. {t.whatsappStep}</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{t.whatsappStepHint}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <div className="font-medium">3. {t.publishStep}</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{t.publishStepHint}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={startGoogleSignIn}
          disabled={googleLoading || !googleEnabled}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus:ring-zinc-400"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleEnabled ? (googleLoading ? t.loading : t.continueWithGoogle) : (locale === "en" ? "Coming soon" : "Próximamente")}
        </button>

        <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">{t.googleFootnote}</div>
      </div>
    </div>
  );
}
