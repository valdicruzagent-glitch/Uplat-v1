'use client';

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import { getClientDeviceInfo } from "@/lib/deviceInfo";
import { uploadListingPhotos } from "@/app/lib/photoUpload";

const LocationPicker = dynamic(() => import("@/app/components/LocationPicker"), { ssr: false });

import { DEPARTMENTS_BY_COUNTRY } from "./departments";

const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
].sort((a, b) => a.name.localeCompare(b.name));

type Country = { code: string; name: string; flag: string };

const AMENITIES = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'pool', label: 'Piscina' },
  { id: 'gym', label: 'Gimnasio' },
  { id: 'parking', label: 'Estacionamiento' },
  { id: 'ac', label: 'Aire acondicionado' },
  { id: 'heating', label: 'Calefacción' },
  { id: 'security', label: 'Seguridad 24h' },
  { id: 'elevator', label: 'Ascensor' },
  { id: 'garden', label: 'Jardín' },
  { id: 'terrace', label: 'Terraza' },
  { id: 'balcony', label: 'Balcón' },
  { id: 'furnished', label: 'Amueblado' },
];

export default function SubmitListingForm({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;
  const ll = (esText: string, enText: string) => (locale === "en" ? enText : esText);
  const supabase = getSupabaseClient();

  // Form state
  const [title, setTitle] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [newConstruction, setNewConstruction] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Auth/profile state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ id?: string; full_name?: string; phone?: string; whatsapp_number?: string; avatar_url?: string | null } | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const websiteFieldRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  // Auth/profile refs
  const mounted = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Price formatting helpers
  const formatPrice = (val: string) => {
    const num = Number(val.replace(/,/g, ''));
    return isNaN(num) ? val : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const parsePrice = (val: string) => {
    const num = Number(val.replace(/,/g, ''));
    return Number.isFinite(num) ? num : null;
  };

  // Load auth + profile once
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (!user) {
          setReady(true);
          setErr("Not authenticated");
          return;
        }
        userIdRef.current = user.id;
        setUser(user);
        const { data, error } = await supabase.from('profiles').select('id, full_name, phone, whatsapp_number, avatar_url').eq('id', user.id).maybeSingle();
        if (!isMounted) return;
        if (error) {
          console.error('Profile load error:', error);
          setErr('Failed to load profile');
        } else {
          setProfile(data);
        }
      } catch (e) {
        console.error(e);
        setErr('Unexpected error');
      } finally {
        if (isMounted) setReady(true);
      }
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return;
      const newUser = session?.user ?? null;
      if (newUser?.id !== userIdRef.current) {
        // Reset and reload for new user
        setProfile(null);
        setUser(newUser);
        if (newUser) {
          const { data, error } = await supabase.from('profiles').select('id, full_name, phone, whatsapp_number, avatar_url').eq('id', newUser.id).maybeSingle();
          if (!isMounted) return;
          if (error) setErr('Failed to load profile');
          else setProfile(data);
        } else {
          setProfile(null);
        }
      }
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, [supabase]);

  // Auto-year for new construction
  useEffect(() => {
    if (newConstruction) {
      setYearBuilt(String(new Date().getFullYear()));
    }
  }, [newConstruction]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || !profile || uploading) return;
    setErr(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Honeypot
      const hp = websiteFieldRef.current?.value ?? "";
      if (hp.trim() !== "") {
        console.warn("Honeypot triggered – submission rejected");
        setDone(true);
        return;
      }

      // Validations
      if (!title) throw new Error(ll("Título es requerido", "Title is required"));
      if (!priceUsd) throw new Error(ll("Precio es requerido", "Price is required"));
      if (!countryCode) throw new Error(ll("País es requerido", "Country is required"));
      if (!departmentCode) throw new Error(ll("Departamento es requerido", "Department is required"));
      if (!mode) throw new Error(ll("Operación es requerida", "Operation is required"));
      if (!type) throw new Error(ll("Tipo es requerido", "Type is required"));
      if (!lat || !lng) throw new Error(ll("Selecciona una ubicación en el mapa", "Select a location on the map"));

      const price = parsePrice(priceUsd);
      if (!price) throw new Error(ll("Precio inválido", "Invalid price"));

      const selectedDept = DEPARTMENTS_BY_COUNTRY[countryCode]?.find(d => d.code === departmentCode);
      if (!selectedDept) throw new Error(ll("Departamento no válido", "Invalid department"));

      // 1. Upload photos
      let photoUrls: string[] = [];
      if (files.length > 0) {
        photoUrls = await uploadListingPhotos(user.id, files, (progress) => setUploadProgress(progress));
      }

      // 2. Prepare listing payload
      const bathsNum = baths ? Number(baths) : null;
      const bedsNum = beds ? (beds === "6+" ? 6 : Number(beds)) : null;
      const areaNum = areaM2 ? Number(areaM2) : null;
      const yearNum = yearBuilt ? Number(yearBuilt) : null;

      const payload = {
        profile_id: profile.id,
        title,
        price_numeric: price,
        price_currency: 'USD',
        description: description || null,
        location_country_code: countryCode,
        location_department_code: departmentCode,
        location_city: city,
        location_lat: lat,
        location_lng: lng,
        beds: bedsNum,
        baths: bathsNum,
        area_m2: areaNum,
        year_built: yearNum,
        mode,
        type,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
        photo_links: photoUrls,
        status: 'published',
        source: 'submission_form',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('[SubmitListingForm] final payload:', payload);

      const { error } = await supabase.from('listings').insert(payload);
      if (error) {
        console.error('[SubmitListingForm] insert error:', { message: error.message, details: error.details, code: error.code });
        throw error;
      }

      // Success
      setDone(true);
    } catch (err: any) {
      console.error('Submit error:', err);
      setErr(err.message || ll('Error al publicar', 'Error publishing'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Formatters for selects
  const departmentOptions = countryCode ? DEPARTMENTS_BY_COUNTRY[countryCode] || [] : [];

  if (!ready) {
    return <div className="p-4 text-sm">{ll("Cargando perfil...", "Loading profile...")}</div>;
  }

  if (err && !profile) {
    return <div className="p-4 text-red-600">{err}</div>;
  }

  if (done) {
    return <div className="p-4 text-green-700">{ll("¡Listado publicado correctamente!", "Listing published successfully!")}</div>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Honeypot */}
      <div style={{ display: 'none' }}>
        <label>Website</label>
        <input ref={websiteFieldRef} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Map picker */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{ll("Ubicación en mapa", "Location on map")}</label>
        <LocationPicker onChange={(lat, lng) => { setLat(lat); setLng(lng); }} initialCenter={null} />
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{ll("Mueve el mapa hasta centrar el marcador.", "Move the map to center the marker.")}</p>
      </div>

      {/* Country / Department / City */}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.countryLabel}</div>
          <select className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={countryCode} onChange={e => { setCountryCode(e.target.value); setDepartmentCode(""); }}>
            <option value="">{ll("Selecciona un país", "Select country")}</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.departmentLabel}</div>
          <select className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={departmentCode} onChange={e => setDepartmentCode(e.target.value)} disabled={!countryCode}>
            <option value="">{ll("Selecciona departamento", "Select department")}</option>
            {departmentOptions.map(d => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.cityLabel}</div>
          <input className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={city} onChange={e => setCity(e.target.value)} placeholder={ll("Ciudad o localidad", "City or locality")} />
        </label>
      </div>

      {/* Property specs */}
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.bedsLabel}</div>
          <select className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={beds} onChange={e => setBeds(e.target.value)}>
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
          <select className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={baths} onChange={e => setBaths(e.target.value)}>
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
          <input className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" type="number" min={0} value={areaM2} onChange={e => setAreaM2(e.target.value)} placeholder="120" />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.typeLabel}</div>
          <select className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={type} onChange={e => setType(e.target.value)}>
            <option value="">{ll("Selecciona tipo", "Select type")}</option>
            <option value="casa">{locale === "en" ? "House" : "Casa"}</option>
            <option value="apartamento">{locale === "en" ? "Apartment" : "Apartamento"}</option>
            <option value="terreno">{locale === "en" ? "Land" : "Terreno"}</option>
            <option value="local_comercial">{locale === "en" ? "Commercial space" : "Local comercial"}</option>
            <option value="oficina">{locale === "en" ? "Office" : "Oficina"}</option>
            <option value="bodega">{locale === "en" ? "Warehouse" : "Bodega"}</option>
            <option value="penthouse">{locale === "en" ? "Penthouse" : "Penthouse"}</option>
            <option value="duplex">{locale === "en" ? "Duplex" : "Dúplex"}</option>
            <option value="finca">{locale === "en" ? "Farm" : "Finca"}</option>
          </select>
        </label>
      </div>

      {/* Additional */}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.yearBuiltLabel}</div>
          <input className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" type="number" min={1900} max={2099} value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} placeholder="2020" />
        </label>

        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={newConstruction} onChange={e => setNewConstruction(e.target.checked)} />
          <span>{t.newConstructionLabel}</span>
        </label>

        <div className="text-sm text-zinc-500">
          {profile?.phone || profile?.whatsapp_number ? (
            <span className="text-green-600">{ll("WhatsApp conectado", "WhatsApp connected")}</span>
          ) : (
            <span className="text-red-600">{ll("Falta número de WhatsApp", "Missing WhatsApp number")}</span>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div className="text-sm">
        <div className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">{t.amenitiesLabel}</div>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => (
            <label key={a.id} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800">
              <input type="checkbox" checked={selectedAmenities.includes(a.id)} onChange={e => {
                if (e.target.checked) setSelectedAmenities([...selectedAmenities, a.id]);
                else setSelectedAmenities(selectedAmenities.filter(id => id !== a.id));
              }} />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.listingTitleLabel}</label>
        <input className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={title} onChange={e => setTitle(e.target.value)} placeholder={ll("e.g. Casa hermosa en la playa", "e.g. Beautiful beachfront house")} required />
      </div>

      {/* Price and Operation */}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.priceUsd}</div>
          <input
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={formatPrice(priceUsd)}
            onChange={e => setPriceUsd(e.target.value.replace(/,/g, ''))}
            onFocus={e => e.currentTarget.select()}
            inputMode="numeric"
            placeholder={ll("100,000", "100,000")}
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.operationLabel}</div>
          <select className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={mode} onChange={e => setMode(e.target.value)} required>
            <option value="">{ll("Selecciona operación", "Select operation")}</option>
            <option value="buy">{t.buy}</option>
            <option value="rent">{t.rent}</option>
          </select>
        </label>
      </div>

      {/* Description */}
      <label className="text-sm">
        <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.descriptionLabel}</div>
        <textarea className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder={ll("Describe la propiedad...", "Describe the property...")} />
      </label>

      {/* Photo upload */}
      <div className="text-sm">
        <div className="mb-1 font-medium">{t.photosLabel || ll("Fotos", "Photos")}</div>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="mb-2" />
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <img key={i} src={URL.createObjectURL(f)} alt="" className="h-20 w-20 object-cover rounded" />
            ))}
          </div>
        )}
        {uploading && <div className="text-xs">{ll("Subiendo...", "Uploading...")} {Math.round(uploadProgress)}%</div>}
      </div>

      <button
        type="submit"
        disabled={uploading || !ready || !!err}
        className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {uploading ? ll("Publicando...", "Publishing...") : t.publish}
      </button>
    </form>
  );
}
