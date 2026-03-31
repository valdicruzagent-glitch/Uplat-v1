"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import { getClientDeviceInfo } from "@/lib/deviceInfo";

const LocationPicker = dynamic(() => import("@/app/components/LocationPicker"), { ssr: false });

import { DEPARTMENTS_BY_COUNTRY } from "./departments";

const COUNTRIES = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
].sort((a, b) => a.name.localeCompare(b.name));




const AMENITIES_OPTIONS = [
  { value: "ac", label: "Aire acondicionado" },
  { value: "pool", label: "Piscina" },
  { value: "waterfront", label: "Frente al agua" },
  { value: "parking", label: "Estacionamiento" },
  { value: "furnished", label: "Amueblado" },
  { value: "gated", label: "Condominio cerrado" },
];

function formatPrice(value: string): string {
  const num = Number(value.replace(/,/g, ''));
  if (isNaN(num)) return value;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePrice(value: string): number | null {
  const num = Number(value.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

export default function SubmitListingForm({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;
  const supabase = getSupabaseClient();

  const [title, setTitle] = useState("");
  const [priceUsd, setPriceUsd] = useState<string>("");
  const [priceFocused, setPriceFocused] = useState(false);
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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ id?: string; full_name?: string; phone?: string; whatsapp_number?: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[SubmitListingForm] getUser() ->', { userId: user?.id });
      const u = user ?? null;
      setUser(u);
      if (u) {
        const { data, error } = await supabase.from('profiles').select('full_name, phone, whatsapp_number, id').eq('id', u.id).maybeSingle();
        console.log('[SubmitListingForm] profile query result:', { userId: u.id, data, error });
        setProfile(data ?? null);
      } else {
        setProfile(null);
      }
      setLoadingProfile(false);
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      console.log('[SubmitListingForm] onAuthStateChange -> user:', u?.id);
      setUser(u);
      if (u) {
        const { data, error } = await supabase.from('profiles').select('full_name, phone, whatsapp_number, id').eq('id', u.id).maybeSingle();
        console.log('[SubmitListingForm] (onAuth) profile query result:', { userId: u.id, data, error });
        setProfile(data ?? null);
      } else {
        setProfile(null);
      }
      setLoadingProfile(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // UX: auto-fill current year when newConstruction is checked (overwrite any existing)
  useEffect(() => {
    if (newConstruction) {
      const currentYear = new Date().getFullYear();
      setYearBuilt(String(currentYear));
    }
  }, [newConstruction]);

  async function submit(e: React.FormEvent) {
    console.log("SUBMIT_LISTING_FIX_VERSION_ed4db11");
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      // Log form inputs for debugging
      console.log("[SubmitListingForm] form inputs:", {
        title,
        priceUsd,
        countryCode,
        departmentCode,
        city,
        type,
        mode,
        lat,
        lng,
        beds,
        baths,
        areaM2,
        yearBuilt,
        newConstruction,
        selectedAmenities,
      });

      // Honeypot
      const hp = websiteFieldRef.current?.value ?? "";
      if (hp.trim() !== "") {
        console.warn("Honeypot triggered – submission rejected");
        setDone(true);
        return;
      }

      // Validations
      if (!title) throw new Error("Título es requerido");
      if (!priceUsd) throw new Error("Precio es requerido");
      if (!countryCode) throw new Error("País es requerido");
      if (!departmentCode) throw new Error("Departamento es requerido");
      if (!city) throw new Error("Ciudad es requerida");
      if (!type) throw new Error("Tipo es requerido");
      if (!mode) throw new Error("Operación es requerida");
      if (lat === null || lng === null) throw new Error("Ubicación en mapa es requerida");

      // Must be logged in
      if (!user) throw new Error("Acceso no autorizado");

      // Guard: profile still loading?
      if (loadingProfile) {
        throw new Error("Espera un momento mientras cargamos tu perfil");
      }

      // If profile state is null, try to fetch it now (fresh)
      let effectiveProfile = profile;
      if (!effectiveProfile) {
        console.log('[SubmitListingForm] profile state null, fetching fresh...');
        const { data: fresh, error: freshErr } = await supabase
          .from('profiles')
          .select('full_name, phone, whatsapp_number, id')
          .eq('id', user.id)
          .maybeSingle();
        if (freshErr) {
          console.error('[SubmitListingForm] fresh profile fetch error:', freshErr);
          throw new Error("No se pudo cargar el perfil");
        }
        effectiveProfile = fresh;
        console.log('[SubmitListingForm] fresh profile fetched:', { userId: user.id, data: fresh });
        if (!effectiveProfile) {
          throw new Error("Perfil no encontrado");
        }
      }

      const price = parsePrice(priceUsd);
      if (price === null) throw new Error("Precio inválido");

      const device = getClientDeviceInfo();
      const photoLinksArray = photoLinks ? photoLinks.split('\n').map(l => l.trim()).filter(Boolean) : null;

      // Use profile data (required) – prioritize whatsapp_number, fallback to phone
      const phone =
        effectiveProfile?.whatsapp_number ||
        effectiveProfile?.phone ||
        user.user_metadata?.whatsapp_number ||
        user.user_metadata?.phone ||
        "";
      const name = effectiveProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || null;

      // Debug log
      console.log({
        profile: effectiveProfile,
        profilePhone: effectiveProfile?.phone,
        profileWhatsapp: effectiveProfile?.whatsapp_number,
        metadataPhone: user.user_metadata?.phone,
        metadataWhatsapp: user.user_metadata?.whatsapp_number,
      });

      // Render-state log for submit
      console.log("[SubmitListingForm submit values]", {
        userId: user?.id,
        profile: effectiveProfile,
        resolvedPhone: phone,
        profilePhone: effectiveProfile?.phone,
        profileWhatsapp: effectiveProfile?.whatsapp_number,
        metadataPhone: user.user_metadata?.phone,
        metadataWhatsapp: user.user_metadata?.whatsapp_number,
      });

      if (!phone) throw new Error("Perfil incompleto: falta número de WhatsApp");

      // Parse beds and baths
      const bedsNum = beds ? (beds === "6+" ? 6 : Number(beds)) : null;
      const bathsNum = baths ? Number(baths) : null; // supports 1.5 etc.
      const yearBuiltNum = yearBuilt ? Number(yearBuilt) : null;

      // Build payload for listings table
      const listingPayload = {
        profile_id: effectiveProfile.id,
        title,
        price_numeric: price,
        price_currency: 'USD',
        description: description || null,
        // location fields (use codes, not names)
        location_country_code: countryCode,
        location_department_code: departmentCode,
        location_city: city,
        location_lat: lat,
        location_lng: lng,
        beds: bedsNum,
        baths: bathsNum,
        area_m2: areaM2 ? Number(areaM2) : null,
        year_built: yearBuiltNum,
        mode,
        type,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
        photo_links: photoLinksArray,
        status: 'published',
        source: 'submission_form',
      };

      console.log('[SubmitListingForm] about to insert listings:', listingPayload);
      const { data, error } = await supabase.from("listings").insert(listingPayload);
      console.log('[SubmitListingForm] insert response:', { data, error });
      if (error) {
        console.error('[SubmitListingForm] insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }
      setDone(true);
    } catch (e: unknown) {
      console.error('[SubmitListingForm] submit error:', e);
      let msg = "Failed";
      if (e instanceof Error) {
        msg = e.message;
        const supabaseErr = e as any;
        if (supabaseErr?.code || supabaseErr?.details) {
          msg += ` (code: ${supabaseErr.code}, details: ${supabaseErr.details})`;
        }
      } else {
        msg = String(e);
      }
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 whitespace-pre-wrap">
          {typeof err === 'string' ? err : JSON.stringify(err, null, 2)}
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
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
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
          <select
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
          >
            <option value="">—</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6+">6+</option>
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.bathsLabel}</div>
          <select
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={baths}
            onChange={(e) => setBaths(e.target.value)}
          >
            <option value="">—</option>
            <option value="1">1</option>
            <option value="1.5">1.5</option>
            <option value="2">2</option>
            <option value="2.5">2.5</option>
            <option value="3">3</option>
            <option value="3.5">3.5</option>
            <option value="4+">4+</option>
          </select>
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

      {/* Title */}
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
            value={priceFocused ? priceUsd : formatPrice(priceUsd)}
            onChange={(e) => setPriceUsd(e.target.value.replace(/,/g, ''))}
            onFocus={() => setPriceFocused(true)}
            onBlur={() => setPriceFocused(false)}
            inputMode="numeric"
            placeholder="100,000"
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

      <button
        type="submit"
        disabled={loading || loadingProfile}
        className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? (locale === "es" ? "Publicando..." : "Publishing...") : (locale === "es" ? t.publish : "Publish")}
      </button>
    </form>
  );
}
