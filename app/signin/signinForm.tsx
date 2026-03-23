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
  const [showManualPath, setShowManualPath] = useState(false);
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
          disabled={googleLoading}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {googleLoading ? t.loading : t.continueWithGoogle}
        </button>

        <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">{t.googleFootnote}</div>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{t.manualFallbackTitle}</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.manualFallbackSubtitle}</div>
          </div>
          <button
            type="button"
            onClick={() => setShowManualPath((value) => !value)}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            {showManualPath ? t.hideManualPath : t.showManualPath}
          </button>
        </div>

        {showManualPath ? (
          <form onSubmit={submitManualLead} className="mt-4 flex flex-col gap-3">
            <label className="text-sm">
              <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.yourName}</div>
              <input
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={locale === "en" ? "Maria Lopez" : "María López"}
              />
            </label>

            <label className="text-sm">
              <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.yourWhatsapp}</div>
              <input
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={locale === "en" ? "+505 8888 8888" : "+505 8888 8888"}
                required
              />
            </label>

            <label className="text-sm">
              <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.roleLabel}</div>
              <select
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                value={role}
                onChange={(e) => setRole(e.target.value as "realtor" | "agency" | "seller" | "other")}
              >
                <option value="realtor">{t.roleRealtor}</option>
                <option value="agency">{t.roleAgency}</option>
                <option value="seller">{t.roleSeller}</option>
                <option value="other">{t.roleOther}</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? t.loading : t.continueManual}
            </button>

            <div className="text-xs text-zinc-600 dark:text-zinc-400">{t.manualFallbackFootnote}</div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
