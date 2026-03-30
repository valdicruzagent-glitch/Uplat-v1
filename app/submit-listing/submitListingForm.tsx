"use client";

import { useEffect, useState, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import { getClientDeviceInfo } from "@/lib/deviceInfo";

export default function SubmitListingForm({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;

  const [contactName, setContactName] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  const [title, setTitle] = useState("");
  const [priceUsd, setPriceUsd] = useState<string>("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [photoLinks, setPhotoLinks] = useState("");

  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const websiteFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContactWhatsapp(window.localStorage.getItem("uplat_contact_whatsapp") ?? "");
    setContactName(window.localStorage.getItem("uplat_contact_name") ?? "");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const supabase = getSupabaseClient();

      // Honeypot check – reject if filled (bot)
      const hp = websiteFieldRef.current?.value ?? "";
      if (hp.trim() !== "") {
        console.warn("Honeypot triggered – submission rejected");
        setDone(true);
        return;
      }

      if (!contactWhatsapp) throw new Error("WhatsApp is required");
      if (!title) throw new Error("Title is required");

      const price = priceUsd ? Number(priceUsd) : null;

      const device = getClientDeviceInfo();

      const photoLinksArray = photoLinks
        ? photoLinks.split('\n').map(l => l.trim()).filter(Boolean)
        : null;

      setLoading(true);

      const { error } = await supabase.from("listing_submissions").insert({
        locale,
        contact_whatsapp: contactWhatsapp,
        contact_name: contactName || null,
        title,
        price_usd: Number.isFinite(price) ? price : null,
        country: country || null,
        city: city || null,
        mode: mode || null,
        type: type || null,
        description: description || null,
        photo_links: photoLinksArray,
        device_info: device,
      });

      if (error) throw error;
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
        {t.sentOk}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {/* Hidden honeypot field */}
      <div style={{ display: 'none' }}>
        <input
          ref={websiteFieldRef}
          name="website"
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.yourName}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.yourWhatsapp}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={contactWhatsapp}
            onChange={(e) => setContactWhatsapp(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="text-sm">
        <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.listingTitleLabel}</div>
        <input
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.priceUsd}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
            inputMode="numeric"
            placeholder="100000"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.countryLabel}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Nicaragua"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.cityLabel}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Managua"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.typeLabel}</div>
          <select
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">—</option>
            <option value="house">{t.house}</option>
            <option value="land">{t.land}</option>
            <option value="apartment">{t.apartment}</option>
          </select>
        </label>
      </div>

      <label className="text-sm">
        <div className="mb-1 text-zinc-700 dark:text-zinc-300">Mode</div>
        <select
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="">—</option>
          <option value="buy">{t.buy}</option>
          <option value="rent">{t.rent}</option>
        </select>
      </label>

      <label className="text-sm">
        <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.descriptionLabel}</div>
        <textarea
          className="min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="text-sm">
        <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.photosLabel}</div>
        <textarea
          className="min-h-16 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={photoLinks}
          onChange={(e) => setPhotoLinks(e.target.value)}
          placeholder={locale === "en" ? "https://...\nhttps://..." : "https://...\nhttps://..."}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {loading ? t.loading : t.send}
      </button>
    </form>
  );
}
