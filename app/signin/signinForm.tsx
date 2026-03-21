"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import { getClientDeviceInfo } from "@/lib/deviceInfo";

function normalizeWhatsapp(input: string) {
  return input.replace(/\s+/g, "").replace(/^00/, "+");
}

export default function SignInForm({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<"realtor" | "seller" | "other">("realtor");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
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

      // store locally so submit-listing can prefill
      window.localStorage.setItem("uplat_contact_whatsapp", wa);
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
    const basePath = locale === "en" ? "/en" : "";
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>{t.thanks}</div>
        <div className="mt-3">
          <a
            className="inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href={basePath + "/start"}
          >
            {locale === "en" ? "Continue" : "Continuar"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </div>
      ) : null}

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
          onChange={(e) => setRole(e.target.value as "realtor" | "seller" | "other")}
        >
          <option value="realtor">{t.roleRealtor}</option>
          <option value="seller">{t.roleSeller}</option>
          <option value="other">{t.roleOther}</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {loading ? t.loading : t.continue}
      </button>

      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        {locale === "en" ? "Next: submit a listing." : "Siguiente: subir una propiedad."} {" "}
        <a className="underline" href={locale === "en" ? "/en/submit-listing" : "/submit-listing"}>
          {locale === "en" ? "Submit listing" : "Subir propiedad"}
        </a>
      </div>
    </form>
  );
}
