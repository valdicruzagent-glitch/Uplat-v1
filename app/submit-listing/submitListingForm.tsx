'use client';

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import { uploadListingPhotos } from "@/app/lib/photoUpload";
import { compressImages, blobToFile } from "@/app/lib/imageUtils";

const LocationPicker = dynamic(() => import("@/app/components/LocationPicker"), { ssr: false });

import { DEPARTMENTS_BY_COUNTRY } from "./departments";

const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BZ", name: "Belice", flag: "🇧🇿" },
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
  const editListingId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('edit') : null;

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
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [locationEditEnabled, setLocationEditEnabled] = useState(false);

  // Auth/profile state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ id?: string; full_name?: string; phone?: string; whatsapp_number?: string; avatar_url?: string | null } | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [editingLoaded, setEditingLoaded] = useState(false);

  const websiteFieldRef = useRef<HTMLInputElement>(null);
  // Auth/profile refs
  const mounted = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Price formatting helpers
  const formatPrice = (val: string) => {
    const num = Number(val.replace(/,/g, ''));
    return isNaN(num) ? val : num.toLocaleString('en-US');
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

  useEffect(() => {
    if (!editListingId || !user?.id || editingLoaded) return;

    let cancelled = false;

    const loadListingForEdit = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, profile_id, title, price_usd, country_code, department_code, city, mode, type, description, lat, lng, beds, baths, area_m2, year_built, new_construction, amenities, image_urls, cover_image_url')
        .eq('id', editListingId)
        .eq('profile_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Edit listing load error:', error);
        setErr(ll('No se pudo cargar el listing para editar', 'Could not load listing for editing'));
        setEditingLoaded(true);
        return;
      }

      if (!data) {
        setErr(ll('No encontramos ese listing para editar con tu cuenta', 'Listing not found for this account'));
        setEditingLoaded(true);
        return;
      }

      setTitle(data.title || '');
      setPriceUsd(data.price_usd ? Number(data.price_usd).toLocaleString('en-US') : '');
      setCountryCode(data.country_code || '');
      setDepartmentCode(data.department_code || '');
      setCity(data.city || '');
      setMode(data.mode || '');
      setType(data.type || '');
      setDescription(data.description || '');
      setLat(typeof data.lat === 'number' ? data.lat : null);
      setLng(typeof data.lng === 'number' ? data.lng : null);
      setBeds(data.beds ? String(data.beds) : '');
      setBaths(data.baths ? String(data.baths) : '');
      setAreaM2(data.area_m2 ? String(data.area_m2) : '');
      setYearBuilt(data.year_built ? String(data.year_built) : '');
      setNewConstruction(Boolean(data.new_construction));
      setSelectedAmenities(Array.isArray(data.amenities) ? data.amenities : []);
      const normalizedExistingImages = Array.from(new Set([
        ...(Array.isArray(data.image_urls) ? data.image_urls.filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0) : []),
        typeof data.cover_image_url === 'string' && data.cover_image_url.trim().length > 0 ? data.cover_image_url : null,
      ].filter((url): url is string => Boolean(url))));
      const currentCoverIndex = typeof data.cover_image_url === 'string'
        ? normalizedExistingImages.findIndex((url) => url === data.cover_image_url)
        : -1;
      setExistingImageUrls(normalizedExistingImages);
      setSelectedCoverIndex(currentCoverIndex >= 0 ? currentCoverIndex : 0);
      setEditingLoaded(true);
    };

    loadListingForEdit();

    return () => {
      cancelled = true;
    };
  }, [editListingId, user?.id, editingLoaded, supabase, locale]);

  useEffect(() => {
    if (!editListingId) {
      setLocationEditEnabled(true);
    }
  }, [editListingId]);

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

  const photoPreviewUrls = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  const showingReplacementFiles = files.length > 0;
  const imageBlockItems = showingReplacementFiles
    ? files.map((file, index) => ({
        key: `new-${file.name}-${index}`,
        src: photoPreviewUrls[index],
        label: file.name,
      }))
    : existingImageUrls.map((url, index) => ({
        key: `existing-${index}-${url}`,
        src: url,
        label: ll(`Foto ${index + 1}`, `Photo ${index + 1}`),
      }));

  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviewUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 25);
    setFiles(selected);
    setSelectedCoverIndex(0);
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

      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);

      const titleValue = String(formData.get('title') || title).trim();
      const priceValue = String(formData.get('priceUsd') || priceUsd).trim();
      const countryValue = String(formData.get('countryCode') || countryCode).trim();
      const departmentValue = String(formData.get('departmentCode') || departmentCode).trim();
      const cityValue = String(formData.get('city') || city).trim();
      const modeValue = String(formData.get('mode') || mode).trim();
      const typeValue = String(formData.get('type') || type).trim();
      const descriptionValue = String(formData.get('description') || description).trim();
      const bedsValue = String(formData.get('beds') || beds).trim();
      const bathsValue = String(formData.get('baths') || baths).trim();
      const areaValue = String(formData.get('areaM2') || areaM2).trim();
      const yearValue = String(formData.get('yearBuilt') || yearBuilt).trim();

      setTitle(titleValue);
      setPriceUsd(priceValue);
      setCountryCode(countryValue);
      setDepartmentCode(departmentValue);
      setCity(cityValue);
      setMode(modeValue);
      setType(typeValue);
      setDescription(descriptionValue);
      setBeds(bedsValue);
      setBaths(bathsValue);
      setAreaM2(areaValue);
      setYearBuilt(yearValue);

      // Validations
      if (!titleValue) throw new Error(ll("Título es requerido", "Title is required"));
      if (!priceValue) throw new Error(ll("Precio es requerido", "Price is required"));
      if (!countryValue) throw new Error(ll("País es requerido", "Country is required"));
      if (!departmentValue) throw new Error(ll("Departamento es requerido", "Department is required"));
      if (!cityValue) throw new Error(ll("Ciudad es requerida", "City is required"));
      if (!modeValue) throw new Error(ll("Operación es requerida", "Operation is required"));
      if (!typeValue) throw new Error(ll("Tipo es requerido", "Type is required"));
      if (!descriptionValue) throw new Error(ll("Descripción es requerida", "Description is required"));
      if (lat === null || lng === null) throw new Error(ll("Selecciona una ubicación en el mapa", "Select a location on the map"));

  const priceNum = parsePrice(priceValue);
      if (priceNum === null) throw new Error(ll("Precio inválido", "Invalid price"));

      let resolvedProfileId = profile?.id || null;
      let resolvedProfile = profile;

      if (!resolvedProfileId && user?.id) {
        const profileRes = await supabase
          .from('profiles')
          .select('id, full_name, phone, whatsapp_number, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profileRes.error) {
          console.error('Profile reload error:', profileRes.error);
        } else if (profileRes.data) {
          resolvedProfile = profileRes.data;
          resolvedProfileId = profileRes.data.id;
          setProfile(profileRes.data);
        }
      }

      const profileId = resolvedProfileId || user.id;
      if (!profileId) throw new Error(ll("No se encontró el perfil del usuario", "User profile not found"));

      const listingPayload = {
        title: titleValue,
        price_usd: priceNum,
        country_code: countryValue,
        department_code: departmentValue,
        city: cityValue,
        mode: modeValue,
        type: typeValue,
        description: descriptionValue || null,
        lat,
        lng,
        beds: bedsValue === '6+' ? 6 : (bedsValue ? Number(bedsValue) : null),
        baths: bathsValue === '6+' ? 6 : (bathsValue ? Number(bathsValue) : null),
        area_m2: areaValue ? Number(areaValue) : null,
        year_built: yearValue ? Number(yearValue) : null,
        new_construction: newConstruction || false,
        amenities: selectedAmenities,
        contact_name: resolvedProfile?.full_name || null,
        contact_whatsapp: resolvedProfile?.whatsapp_number || null,
        published_at: new Date().toISOString(),
        source: 'submission_form',
        status: 'published',
        profile_id: profileId,
      };

      let listingId = editListingId;

      if (editListingId) {
        const { data: updateData, error: updateError } = await supabase
          .from('listings')
          .update(listingPayload)
          .eq('id', editListingId)
          .eq('profile_id', profileId)
          .select('id')
          .single();

        if (updateError) throw updateError;
        listingId = updateData.id;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('listings')
          .insert([listingPayload])
          .select('id')
          .single();

        if (insertError) throw insertError;
        listingId = insertData.id;
      }

      // Subir fotos si hay
      if (!listingId) throw new Error(ll("No se pudo resolver el listing a guardar", "Could not resolve listing to save"));

      if (files.length > 0) {
        setUploadProgress(10);
        // Comprimir imágenes (WebP, max 1600px)
        const compressedBlobs = await compressImages(files, 1600, 0.8);
        const compressedFiles = compressedBlobs.map((blob, idx) => blobToFile(blob, files[idx].name));
        setUploadProgress(30);
        const urls = await uploadListingPhotos({
          userId: user.id,
          files: compressedFiles,
          listingId,
          onProgress: p => setUploadProgress(30 + Math.round(p * 0.7))
        });
        // Portada: usar selectedCoverIndex o primera
        const coverIdx = selectedCoverIndex >= 0 && selectedCoverIndex < urls.length ? selectedCoverIndex : 0;
        await supabase.from('listings').update({
          cover_image_url: urls[coverIdx],
          image_urls: urls
        }).eq('id', listingId);
      } else if (editListingId && existingImageUrls.length > 0) {
        const coverIdx = selectedCoverIndex >= 0 && selectedCoverIndex < existingImageUrls.length ? selectedCoverIndex : 0;
        await supabase.from('listings').update({
          cover_image_url: existingImageUrls[coverIdx],
          image_urls: existingImageUrls,
        }).eq('id', listingId);
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
    <>
      {/* Banner informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-900">{ll("¡Crédito gratis!", "Free credit!")}</h3>
        <p className="text-sm text-blue-800 mt-1">
          {ll("Tienes un crédito gratis para publicar una propiedad. Después de usarlo, tendrás que comprar créditos adicionales.",
              "You have a free credit to publish a listing. After using it, you'll need to purchase additional credits.")}
        </p>
        <p className="text-sm text-blue-800 mt-2">
          {ll("Importante: solo publica propiedades reales. Propiedades falsas o engañosas pueden causar la desactivación de tu cuenta.",
              "Important: only publish real listings. Fake or misleading listings may result in account deactivation.")}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Honeypot */}
        <div style={{ display: 'none' }}>
          <label>Website</label>
          <input ref={websiteFieldRef} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {/* Map picker */}
        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{ll("Ubicación en mapa", "Location on map")}</label>
            {editListingId ? (
              <button
                type="button"
                onClick={() => setLocationEditEnabled((value) => !value)}
                className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {locationEditEnabled ? ll("Listo", "Done") : ll("Editar ubicación", "Edit location")}
              </button>
            ) : null}
          </div>
          {editListingId && lat !== null && lng !== null ? (
            <div className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {ll("Ubicación actual guardada:", "Current saved location:")} {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          ) : null}
          {locationEditEnabled ? (
            <>
              <LocationPicker onChange={(lat, lng) => { setLat(lat); setLng(lng); }} initialCenter={lat !== null && lng !== null ? [lat, lng] : null} />
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{ll("Mueve el mapa hasta centrar el marcador.", "Move the map to center the marker.")}</p>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {ll("Ubicación bloqueada hasta que toques 'Editar ubicación'.", "Location is locked until you tap 'Edit location'.")}
            </div>
          )}
        </div>

        {/* Country / Department / City */}
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.countryLabel}</div>
            <select name="countryCode" className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={countryCode} onChange={e => { setCountryCode(e.target.value); setDepartmentCode(""); }}>
              <option value="">{ll("Selecciona un país", "Select country")}</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.departmentLabel}</div>
            <select name="departmentCode" className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={departmentCode} onChange={e => setDepartmentCode(e.target.value)} disabled={!countryCode}>
              <option value="">{ll("Selecciona departamento", "Select department")}</option>
              {departmentOptions.map(d => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.cityLabel}</div>
            <input name="city" className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={city} onChange={e => setCity(e.target.value)} placeholder={ll("Ciudad o localidad", "City or locality")} />
          </label>
        </div>

        {/* Property specs */}
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.bedsLabel}</div>
            <select name="beds" className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={beds} onChange={e => setBeds(e.target.value)}>
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
            <select name="baths" className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={baths} onChange={e => setBaths(e.target.value)}>
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
            <input name="areaM2" className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={areaM2} onChange={e => setAreaM2(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={ll("m²", "sq ft")} />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.yearBuiltLabel}</div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={new Date().getFullYear()}
              step={1}
              name="yearBuilt"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={yearBuilt}
              onChange={e => setYearBuilt(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder={ll("Año (opcional)", "Year (optional)")}
            />
          </label>
        </div>

        {/* Listing basics */}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.listingTitleLabel}</div>
            <input name="title" required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={title} onChange={e => setTitle(e.target.value)} placeholder={ll("Título atractivo", "Catchy title")} />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.priceUsd}</div>
            <input
              required
              name="priceUsd"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={priceUsd}
              onChange={e => setPriceUsd(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={e => setPriceUsd(formatPrice(e.target.value))}
              placeholder={ll("0", "0")}
              type="text"
              inputMode="numeric"
            />
          </label>
        </div>

        {/* Mode & Type */}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.operationLabel}</div>
            <select name="mode" required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="">{ll("Selecciona operación", "Select operation")}</option>
              <option value="buy">{ll("Vender", "Sell")}</option>
              <option value="rent">{ll("Rentar", "Rent")}</option>
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-zinc-700 dark:text-zinc-300">{t.typeLabel}</div>
            <select name="type" required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={type} onChange={e => setType(e.target.value)}>
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
          <textarea name="description" required className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder={ll("Describe la propiedad", "Describe the property")} />
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
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{ll('Fotos y portada', 'Photos and cover')}</label>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{ll('Toca una imagen para marcarla como portada.', 'Tap an image to mark it as the cover.')}</p>
            </div>
            {imageBlockItems.length > 0 ? (
              <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                {showingReplacementFiles
                  ? ll(`${files.length}/25 fotos nuevas`, `${files.length}/25 new photos`)
                  : ll(`${existingImageUrls.length} fotos actuales`, `${existingImageUrls.length} current photos`)}
              </div>
            ) : null}
          </div>

          <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300" />
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{ll("Las imágenes se comprimen automáticamente antes de subirlas.", "Images are automatically compressed before upload.")}</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{ll("Puedes seleccionar múltiples imágenes", "You can select multiple images")}</p>
          {editListingId && existingImageUrls.length > 0 && !showingReplacementFiles ? (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {ll('Mostrando las fotos actuales del listing. Si subes nuevas fotos, reemplazarán esta galería al guardar.', 'Showing the current listing photos. If you upload new photos, they will replace this gallery when you save.')}
            </p>
          ) : null}
          {showingReplacementFiles ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              {ll('Estas fotos nuevas reemplazarán las actuales cuando guardes.', 'These new photos will replace the current gallery when you save.')}
            </p>
          ) : null}

          {imageBlockItems.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {imageBlockItems.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedCoverIndex(index)}
                  className={`overflow-hidden rounded-lg border text-left ${selectedCoverIndex === index ? 'border-blue-600 ring-2 ring-blue-200' : 'border-zinc-200 dark:border-zinc-800'}`}
                >
                  <img src={item.src} alt={item.label} className="h-32 w-full object-cover" />
                  <div className="flex items-center justify-between px-2 py-2 text-xs">
                    <span className="truncate">{item.label}</span>
                    <span className={`${selectedCoverIndex === index ? 'text-blue-600 font-semibold' : 'text-zinc-500'}`}>
                      {selectedCoverIndex === index ? ll('Portada', 'Cover') : ll('Elegir', 'Pick')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              {editListingId
                ? ll('Todavía no hay fotos cargadas para este listing.', 'There are no uploaded photos for this listing yet.')
                : ll('Todavía no has seleccionado fotos.', 'You have not selected any photos yet.')}
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
            {uploading ? ll("Procesando...", "Processing...") : t.publish}
          </button>
        </div>
      </form>
    </>
  );
}
