'use client';

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
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

  // Load auth + profile (non-blocking)
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (!user) {
          setErr("Not authenticated");
          setReady(true);
          return;
        }
        userIdRef.current = user.id;
        setUser(user);
        // Load profile in background, don't block
        supabase.from('profiles')
          .select('id, full_name, phone, whatsapp_number, avatar_url')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data, error }: { data: any; error: any }) => {
            if (!isMounted) return;
            if (error) {
              console.error('Profile load error:', error);
            } else {
              setProfile(data);
            }
          })
          .catch((e: any) => console.error('Profile load exception:', e));
      } catch (e) {
        console.error(e);
        setErr('Unexpected error');
      } finally {
        if (isMounted) setReady(true);
      }
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return;
      const newUser = session?.user ?? null;
      if (newUser?.id !== userIdRef.current) {
        setProfile(null);
        setUser(newUser);
        if (newUser) {
          userIdRef.current = newUser.id;
          supabase.from('profiles')
            .select('id, full_name, phone, whatsapp_number, avatar_url')
            .eq('id', newUser.id)
            .maybeSingle()
            .then(({ data, error }: { data: any; error: any }) => {
              if (!isMounted) return;
              if (error) console.error('Profile load error:', error);
              else setProfile(data);
            })
            .catch((e: any) => console.error(e));
        } else {
          setErr("Not authenticated");
        }
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Auto-year for new construction
  useEffect(() => {
    if (newConstruction) {
      setYearBuilt(String(new Date().getFullYear()));
    }
  }, [newConstruction]);

  // Diagnostic: component mount
  useEffect(() => {
    console.log('[SubmitListingForm] mounted');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || uploading || !user) {
      setErr("Not authenticated or form not ready");
      return;
    }
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

      const priceNum = parsePrice(priceUsd);
      if (priceNum === null) throw new Error(ll("Precio inválido", "Invalid price"));

      // Upload photos
      let image_urls: string[] = [];
      if (files.length > 0) {
        const deviceInfo = getClientDeviceInfo();
        const uploadResult = await uploadListingPhotos({
          files,
          listingId: 'temp-' + Date.now(),
          userId: user.id,
          deviceInfo,
          onProgress: p => setUploadProgress(Math.round(p * 100)),
        });
        image_urls = uploadResult.urls;
      }

      // Prepare listing payload
      const payload: any = {
        title,
        price_usd: priceNum,
        country_code: countryCode,
        department_code: departmentCode,
        city,
        mode,
        type,
        description: description || null,
        lat,
        lng,
        beds: beds ? Number(beds) : null,
        baths: baths ? Number(baths) : null,
        area_m2: areaM2 ? Number(areaM2) : null,
        year_built: yearBuilt ? Number(yearBuilt) : null,
        new_construction: newConstruction || false,
        amenities: selectedAmenities,
        image_urls: image_urls.length > 0 ? image_urls : null,
        contact_name: profile?.full_name || null,
        contact_whatsapp: profile?.whatsapp_number || null,
        published_at: new Date().toISOString(),
        source: 'submission_form',
      };

      if (profile?.id) {
        payload.profile_id = profile.id;
      }

      // Insert into listings via service role (use SUPABASE_URL + service key directly to bypass RLS)
      const { data: insertData, error: insertError } = await supabase
        .from('listings')
        .insert([payload])
        .select('id')
        .single();

      if (insertError) throw insertError;
      const listingId = insertData.id;

      // Upload photos for real now that we have listingId
      if (files.length > 0) {
        await uploadListingPhotos({
          files,
          listingId,
          userId: user.id,
          deviceInfo: getClientDeviceInfo(),
        });
      }

      setDone(true);
      setUploading(false);
    } catch (e: any) {
      console.error(e);
      setErr(e.message || 'Error submitting listing');
      setUploading(false);
    }
  };

  const departmentOptions = countryCode ? DEPARTMENTS_BY_COUNTRY[countryCode] || [] : [];

  if (!ready) {
    return <div className="p-4 text-sm">{ll("Cargando perfil...", "Loading profile...")}</div>;
  }

  if (err && !profile && !user) {
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
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6+">6+</option>
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.areaM2Label}</div>
          <input className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={areaM2} onChange={e => setAreaM2(e.target.value)} placeholder={ll("m²", "sq ft")} />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.yearBuiltLabel}</div>
          <input className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} placeholder={ll("Año (opcional)", "Year (optional)")} type="number" />
        </label>
      </div>

      {/* Listing basics */}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.listingTitleLabel}</div>
          <input required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={title} onChange={e => setTitle(e.target.value)} placeholder={ll("Título atractivo", "Catchy title")} />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.priceUsd}</div>
          <input required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={priceUsd} onChange={e => setPriceUsd(formatPrice(e.target.value))} placeholder="0.00" type="text" inputMode="decimal" />
        </label>
      </div>

      {/* Mode & Type */}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.operationLabel}</div>
          <select required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="">{ll("Selecciona operación", "Select operation")}</option>
            <option value="buy">{ll(t.buy, "Buy")}</option>
            <option value="rent">{ll(t.rent, "Rent")}</option>
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.typeLabel}</div>
          <select required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={type} onChange={e => setType(e.target.value)}>
            <option value="">{ll("Selecciona tipo", "Select type")}</option>
            <option value="house">{t.house}</option>
            <option value="apartment">{t.apartment}</option>
            <option value="land">{t.land}</option>
            <option value="farm">{t.farm}</option>
            <option value="commercial">{ll("Comercial", "Commercial")}</option>
            <option value="office">{ll("Oficina", "Office")}</option>
            <option value="warehouse">{ll("Bodega", "Warehouse")}</option>
          </select>
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.descriptionLabel}</label>
        <textarea required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder={ll("Describe la propiedad", "Describe the property")} />
      </div>

      {/* Amenities */}
      <div>
        <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.amenitiesLabel}</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {AMENITIES.map(a => (
            <label key={a.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" checked={selectedAmenities.includes(a.id)} onChange={e => {
                if (e.target.checked) setSelectedAmenities([...selectedAmenities, a.id]);
                else setSelectedAmenities(selectedAmenities.filter(x => x !== a.id));
              }} />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.photosLabel}</label>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300" />
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{ll("Puedes seleccionar múltiples imágenes", "You can select multiple images")}</p>
        {files.length > 0 && (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {ll(`${files.length} archivo(s) seleccionado(s)`, `${files.length} file(s) selected`)}
          </div>
        )}
        {uploading && (
          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button type="submit" disabled={uploading} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {uploading ? ll("Subiendo...", "Uploading...") : t.publish}
        </button>
      </div>
    </form>
  );
}