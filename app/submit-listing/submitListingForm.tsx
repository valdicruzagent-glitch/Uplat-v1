"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import { getClientDeviceInfo } from "@/lib/deviceInfo";

const LocationPicker = dynamic(() => import("@/app/components/LocationPicker"), { ssr: false });

const COUNTRIES = [
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
].sort((a, b) => a.name.localeCompare(b.name));

const DEPARTMENTS_BY_COUNTRY: Record<string, { code: string; name: string }[]> = {
  BZ: [
    { code: "BZ", name: "Belize" },
    { code: "CY", name: "Cayo" },
    { code: "CZ", name: "Corozal" },
    { code: "OW", name: "Orange Walk" },
    { code: "SC", name: "Stann Creek" },
    { code: "TO", name: "Toledo" },
  ],
  CR: [
    { code: "SJ", name: "San José" },
    { code: "AL", name: "Alajuela" },
    { code: "CA", name: "Cartago" },
    { code: "HE", name: "Heredia" },
    { code: "GU", name: "Guanacaste" },
    { code: "PU", name: "Puntarenas" },
    { code: "LI", name: "Limón" },
  ],
  SV: [
    { code: "AH", name: "Ahuachapán" },
    { code: "CB", name: "Cabañas" },
    { code: "CH", name: "Chalatenango" },
    { code: "CU", name: "Cuscatlán" },
    { code: "LB", name: "La Libertad" },
    { code: "PZ", name: "La Paz" },
    { code: "UN", name: "La Unión" },
    { code: "MO", name: "Morazán" },
    { code: "SM", name: "San Miguel" },
    { code: "SS", name: "San Salvador" },
    { code: "SV", name: "San Vicente" },
    { code: "SA", name: "Santa Ana" },
    { code: "SO", name: "Sonsonate" },
    { code: "US", name: "Usulután" },
  ],
  GT: [
    { code: "AV", name: "Alta Verapaz" },
    { code: "BV", name: "Baja Verapaz" },
    { code: "CM", name: "Chimaltenango" },
    { code: "CQ", name: "Chiquimula" },
    { code: "PG", name: "El Progreso" },
    { code: "ES", name: "Escuintla" },
    { code: "GU", name: "Guatemala" },
    { code: "HU", name: "Huehuetenango" },
    { code: "IZ", name: "Izabal" },
    { code: "JA", name: "Jalapa" },
    { code: "JU", name: "Jutiapa" },
    { code: "PE", name: "Petén" },
    { code: "QZ", name: "Quetzaltenango" },
    { code: "QC", name: "Quiché" },
    { code: "RE", name: "Retalhuleu" },
    { code: "SM", name: "Sacatepéquez" },
    { code: "SMK", name: "San Marcos" },
    { code: "SR", name: "Santa Rosa" },
    { code: "SO", name: "Sololá" },
    { code: "SU", name: "Suchitepéquez" },
    { code: "TO", name: "Totonicapán" },
    { code: "ZA", name: "Zacapa" },
  ],
  HN: [
    { code: "AT", name: "Atlántida" },
    { code: "CH", name: "Choluteca" },
    { code: "CL", name: "Colón" },
    { code: "CM", name: "Comayagua" },
    { code: "CP", name: "Copán" },
    { code: "CR", name: "Cortés" },
    { code: "EP", name: "El Paraíso" },
    { code: "FM", name: "Francisco Morazán" },
    { code: "GD", name: "Gracias a Dios" },
    { code: "IN", name: "Intibucá" },
    { code: "IB", name: "Islas de la Bahía" },
    { code: "PZ", name: "La Paz" },
    { code: "LE", name: "Lempira" },
    { code: "OC", name: "Ocotepeque" },
    { code: "OL", name: "Olancho" },
    { code: "SB", name: "Santa Bárbara" },
    { code: "VA", name: "Valle" },
    { code: "YO", name: "Yoro" },
  ],
  NI: [
    { code: "BO", name: "Boaco" },
    { code: "CA", name: "Carazo" },
    { code: "CI", name: "Chinandega" },
    { code: "CT", name: "Chontales" },
    { code: "ES", name: "Estelí" },
    { code: "GR", name: "Granada" },
    { code: "JI", name: "Jinotega" },
    { code: "LE", name: "León" },
    { code: "MD", name: "Madriz" },
    { code: "MN", name: "Managua" },
    { code: "MY", name: "Masaya" },
    { code: "MT", name: "Matagalpa" },
    { code: "NS", name: "Nueva Segovia" },
    { code: "RACCN", name: "RACCN" },
    { code: "RACCS", name: "RACCS" },
    { code: "RS", name: "Río San Juan" },
    { code: "RI", name: "Rivas" },
  ],
  PA: [
    { code: "BT", name: "Bocas del Toro" },
    { code: "CL", name: "Coclé" },
    { code: "CN", name: "Colón" },
    { code: "CH", name: "Chiriquí" },
    { code: "DA", name: "Darién" },
    { code: "HE", name: "Herrera" },
    { code: "LS", name: "Los Santos" },
    { code: "PA", name: "Panamá" },
    { code: "PO", name: "Panamá Oeste" },
    { code: "VG", name: "Veraguas" },
  ],
};

const AMENITIES_OPTIONS = [
  { value: "new_construction", label: "Nueva construcción" },
  { value: "ac", label: "Aire acondicionado" },
  { value: "pool", label: "Piscina" },
  { value: "waterfront", label: "Frente al agua" },
  { value: "parking", label: "Estacionamiento" },
  { value: "furnished", label: "Amueblado" },
  { value: "gated", label: "Condominio cerrado" },
];

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
  const [yearBuilt, setYearBuilt] = useState<string>("");
  const [newConstruction, setNewConstruction] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const websiteFieldRef = useRef<HTMLInputElement>(null);

  // Auth / profile state
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', u.id).maybeSingle();
        setProfile(data ?? null);
      }
      setLoadingProfile(false);
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', u.id).maybeSingle();
        setProfile(data ?? null);
      } else {
        setProfile(null);
      }
      setLoadingProfile(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setContactWhatsapp(window.localStorage.getItem("uplat_contact_whatsapp") ?? "");
      setContactName(window.localStorage.getItem("uplat_contact_name") ?? "");
    }
  }, [user]);

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

      if (!user && !contactWhatsapp) throw new Error("WhatsApp es requerido");
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

      // Use profile data if logged in, otherwise form fields
      const phone = user && profile ? (profile.phone || user.user_metadata?.phone) : contactWhatsapp;
      const name = user && profile ? (profile.full_name || user.user_metadata?.full_name) : contactName;

      if (!phone) throw new Error("WhatsApp es requerido");

      const { error } = await supabase.from("listing_submissions").insert({
        locale,
        contact_whatsapp: phone,
        contact_name: name || null,
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
        year_built: yearBuilt ? Number(yearBuilt) : null,
        new_construction: newConstruction || null,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
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
            <option value="apartment">{t.apartment}</option>
            <option value="land">{t.land}</option>
            <option value="farm">{t.farm}</option>
          </select>
        </label>
      </div>

      {/* Additional property data */}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">Año de construcción</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={yearBuilt}
            onChange={(e) => setYearBuilt(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="Ej. 1990"
          />
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            checked={newConstruction}
            onChange={(e) => setNewConstruction(e.target.checked)}
          />
          <span>Nueva construcción</span>
        </label>
      </div>

      {/* Amenities */}
      <div>
        <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Características / Amenidades</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {AMENITIES_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300"
                checked={selectedAmenities.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedAmenities([...selectedAmenities, opt.value]);
                  else setSelectedAmenities(selectedAmenities.filter((v) => v !== opt.value));
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Title (full width) */}
      <div className="md:col-span-4">
        <label className="text-sm">
          <div className="mb-1 flex items-center justify-between text-zinc-700 dark:text-zinc-300">
            <span>{t.listingTitleLabel}</span>
            <span className="text-xs text-zinc-500">{title.length}/100</span>
          </div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
          />
        </label>
      </div>

      {/* Price and Operation */}
      <div className="grid gap-3 md:grid-cols-2">
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

      {/* Contact – conditional */}
      {user && profile ? (
        <div className="md:col-span-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 text-sm">
          <p className="font-medium">{profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
          <p className="text-zinc-600 dark:text-zinc-400">{profile.phone || user.user_metadata?.phone || 'Teléfono no configurado'}</p>
        </div>
      ) : (
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
      )}

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
