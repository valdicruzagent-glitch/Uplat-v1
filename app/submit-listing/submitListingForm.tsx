"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import { getClientDeviceInfo } from "@/lib/deviceInfo";

const LocationPicker = dynamic(() => import("@/app/components/LocationPicker"), { ssr: false });

const COUNTRIES = [
  { code: "NI", name: "Nicaragua" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panamá" },
  { code: "HN", name: "Honduras" },
  { code: "GT", name: "Guatemala" },
  { code: "SV", name: "El Salvador" },
];
const DEPARTMENTS_BY_COUNTRY: Record<string, { code: string; name: string }[]> = {
  NI: [
    { code: "MN", name: "Managua" },
    { code: "SJ", name: "San Juan del Sur" },
    { code: "GR", name: "Granada" },
    { code: "LE", name: "León" },
    { code: "CQ", name: " Chinandega" },
  ],
  CR: [
    { code: "SJ", name: "San José" },
    { code: "AL", name: "Alajuela" },
    { code: "CA", name: "Cartago" },
  ],
  PA: [
    { code: "PA", name: "Panamá" },
    { code: "CH", name: "Chiriquí" },
  ],
  HN: [
    { code: "FM", name: "Francisco Morazán" },
    { code: "CP", name: "Cortés" },
  ],
  GT: [
    { code: "GU", name: "Guatemala" },
    { code: "AN", name: "Antigua" },
  ],
  SV: [
    { code: "SS", name: "San Salvador" },
    { code: "SM", name: "Santa Ana" },
  ],
};

export default function SubmitListingForm({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;

  const [contactName, setContactName] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  const [title, setTitle] = useState("");
  const [priceUsd, setPriceUsd] = useState<string>("");
  const [countryCode, setCountryCode] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [photoLinks, setPhotoLinks] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [beds, setBeds] = useState<string>("");
  const [baths, setBaths] = useState<string>("");
  const [areaM2, setAreaM2] = useState<string>("");

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

      // Honeypot
      const hp = websiteFieldRef.current?.value ?? "";
      if (hp.trim() !== "") {
        console.warn("Honeypot triggered – submission rejected");
        setDone(true);
        return;
      }

      if (!contactWhatsapp) throw new Error("WhatsApp es requerido");
      if (!title) throw new Error("Título es requerido");
      if (!priceUsd) throw new Error("Precio es requerido");
      if (!countryCode) throw new Error("País es requerido");
      if (!departmentCode) throw new Error("Departamento es requerido");
      if (!city) throw new Error("Ciudad es requerida");
      if (!type) throw new Error("Tipo es requerido");
      if (!mode) throw new Error("Operación es requerida");
      if (lat === null || lng === null) throw new Error("Ubicación en mapa es requerida");

      const price = priceUsd ? Number(priceUsd) : null;
      const device = getClientDeviceInfo();
      const photoLinksArray = photoLinks ? photoLinks.split('\n').map(l => l.trim()).filter(Boolean) : null;

      const { error } = await supabase.from("listing_submissions").insert({
        locale,
        contact_whatsapp: contactWhatsapp,
        contact_name: contactName || null,
        title,
        price_usd: Number.isFinite(price) ? price : null,
        country: COUNTRIES.find(c => c.code === countryCode)?.name || null,
        department: DEPARTMENTS_BY_COUNTRY[countryCode]?.find(d => d.code === departmentCode)?.name || null,
        city,
        mode: mode || null,
        type: type || null,
        description: description || null,
        photo_links: photoLinksArray,
        device_info: device,
        lat,
        lng,
        beds: beds ? Number(beds) : null,
        baths: baths ? Number(baths) : null,
        area_m2: areaM2 ? Number(areaM2) : null,
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

  const currentCountry = DEPARTMENTS_BY_COUNTRY[countryCode] || [];

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Hidden honeypot */}
      <div style={{ display: 'none' }}>
        <input ref={websiteFieldRef} name="website" autoComplete="off" tabIndex={-1} />
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </div>
      )}

      {/* Location picker */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ubicación en mapa</label>
        <LocationPicker onChange={(lat, lng) => { setLat(lat); setLng(lng); }} initialCenter={null} />
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Mueve el mapa hasta centrar el marcador en la ubicación correcta.</p>
      </div>

      {/* Country / Department / City */}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.countryLabel}</div>
          <select
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value);
              setDepartmentCode("");
            }}
          >
            <option value="">Selecciona país</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.departmentLabel}</div>
          <select
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value)}
            disabled={!countryCode}
          >
            <option value="">Selecciona departamento</option>
            {currentCountry.map(d => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.cityLabel}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ciudad"
            required
          />
        </label>
      </div>

      {/* Property specs */}
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.bedsLabel}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
            inputMode="numeric"
            placeholder="Ej. 3"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.bathsLabel}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={baths}
            onChange={(e) => setBaths(e.target.value)}
            inputMode="numeric"
            placeholder="Ej. 2"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.areaM2Label}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={areaM2}
            onChange={(e) => setAreaM2(e.target.value)}
            inputMode="numeric"
            placeholder="Ej. 150"
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

      {/* Title, Price, Operation */}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.listingTitleLabel}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

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
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.operationLabel}</div>
          <select
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="">—</option>
            <option value="buy">Vender</option>
            <option value="rent">Rentar</option>
          </select>
        </label>
      </div>

      {/* Description */}
      <label className="text-sm">
        <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.descriptionLabel}</div>
        <textarea
          className="min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      {/* Photo links */}
      <label className="text-sm">
        <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.photosLabel}</div>
        <textarea
          className="min-h-20 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={photoLinks}
          onChange={(e) => setPhotoLinks(e.target.value)}
          placeholder="https://... (una URL por línea)"
        />
      </label>

      {/* Contact */}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.contactWhatsapp}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={contactWhatsapp}
            onChange={(e) => setContactWhatsapp(e.target.value)}
            required
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.yourName}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? "Enviando..." : t.send}
      </button>
    </form>
  );
}
