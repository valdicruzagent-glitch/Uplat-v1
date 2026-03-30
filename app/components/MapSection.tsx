"use client";

/**
 * Public map browse section for Uplat.
 *
 * What this file controls:
 * - Loads listings from Supabase for the homepage map experience.
 * - Applies browse filters for listing type, property type, price, and comparables.
 * - Renders the list of visible property cards below the map.
 *
 * Important dependency:
 * - `public.listings` in Supabase.
 *
 * Safe edit note:
 * - This file is intentionally compatible with both the legacy listing schema
 *   and the canonical V1 schema during migration.
 * - Keep the compatibility helpers until the database migration is fully live.
 * - The browse experience is map-first, so do not reintroduce city dropdowns here.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";

import { getSupabaseClient } from "@/lib/supabaseClient";

import type { Listing } from "@/app/types/listing";

import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";
import FavoriteButton from "@/app/components/FavoriteButton";
import { loadGuestState, saveGuestState, type GuestState } from "@/lib/guestState";
import type { LeafletMapProps } from "@/app/components/LeafletMap";
import type L from "leaflet";

const LeafletMap = dynamic<LeafletMapProps>(() => import("@/app/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950" />
  ),
});

type Filters = {
  listingType: "" | "sale" | "rent";
  propertyTypes: PropertyCategory[];
};

type BoundsBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

function toBoundsBox(b: L.LatLngBounds): BoundsBox {
  const sw = b.getSouthWest();
  const ne = b.getNorthEast();
  return { south: sw.lat, west: sw.lng, north: ne.lat, east: ne.lng };
}

function inBounds(l: Listing, b: BoundsBox | null) {
  if (!b) return true;
  return l.lat >= b.south && l.lat <= b.north && l.lng >= b.west && l.lng <= b.east;
}

function priceNum(v: Listing["price_usd"]) {
  const n = typeof v === "number" ? v : v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getListingType(listing: Listing): "sale" | "rent" | string {
  if (listing.listing_type) return listing.listing_type;
  if (listing.mode === "buy") return "sale";
  if (listing.mode === "rent") return "rent";
  return "sale";
}

function getPropertyType(listing: Listing) {
  return listing.property_type ?? listing.type ?? "house";
}

function getPrimaryImage(listing: Listing) {
  // V1: prefer image_urls array, fallback to cover_image_url
  if (listing.image_urls?.length) return listing.image_urls[0] ?? null;
  return listing.cover_image_url ?? null;
}

function isComparable(listing: Listing) {
  return listing.status === "archived" || listing.meta?.comparable === true;
}

function matchesFilters(listing: Listing, filters: Filters) {
  if (filters.listingType && getListingType(listing) !== filters.listingType) return false;
  if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(getPropertyType(listing) as PropertyCategory)) return false;
  return true;
}


type PropertyCategory = "house" | "apartment" | "land" | "farm";
const ALL_CATEGORIES: PropertyCategory[] = ["house","apartment","land","farm"];
export default function MapSection({
  locale,
  basePath,
  center,
  onCenterChange,
}: {
  locale: "es" | "en";
  basePath: "" | "/en";
  center: [number, number] | null;
  onCenterChange?: (center: [number, number]) => void;
}) {
  const t = locale === "en" ? en : es;
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const guestState: GuestState = loadGuestState();
  const [filters, setFilters] = useState<Filters>({
    listingType: guestState.listingType === "rent" ? "rent" : "sale",
    propertyTypes: guestState.propertyTypes && guestState.propertyTypes.length > 0
      ? (guestState.propertyTypes as PropertyCategory[])
      : ALL_CATEGORIES,
  });
  const [showComps, setShowComps] = useState(false);
  const [bounds, setBounds] = useState<BoundsBox | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const hasUserMovedMap = useRef(false);
  const firstBoundsRef = useRef(true);

  const handleBoundsChange = (b: L.LatLngBounds) => {
    if (firstBoundsRef.current) {
      firstBoundsRef.current = false;
      setBounds(toBoundsBox(b));
      return;
    }
    hasUserMovedMap.current = true;
    setBounds(toBoundsBox(b));
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const supabase = getSupabaseClient();
        let data: any[] | null = null;
        let error: any = null;
        for (let i = 0; i < 2; i++) {
          const res = await supabase
            .from("listings")
            .select('id, title, price_usd, type, mode, city, lat, lng, cover_image_url, headline, listing_type, property_type, image_urls, beds, baths, area_m2, status, contact_whatsapp, updated_at, published_at')
            .order("created_at", { ascending: false });
          data = res.data;
          error = res.error;
          if (!error || error?.status !== 401) break;
          await supabase.auth.signOut();
        }

        if (error) {
          console.error(error);
          setErr(error.message);
          setListings([]);
        } else {
          setListings((data ?? []) as Listing[]);
        }
      } catch (e: unknown) {
        console.error(e);
        const msg = e instanceof Error ? e.message : "Failed to load listings";
        setErr(msg);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Persist filters to guest state
  useEffect(() => {
    const lt = filters.listingType === "sale" ? "buy" : filters.listingType === "rent" ? "rent" : "buy";
    saveGuestState({
      listingType: lt,
      propertyTypes: filters.propertyTypes,
    });
  }, [filters.listingType, filters.propertyTypes]);

  // Persist map center to guest state
  useEffect(() => {
    if (bounds) {
      const center = { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 };
      saveGuestState({ mapCenter: center });
    }
  }, [bounds]);

  const filteredBySchema = useMemo(() => listings.filter((listing) => matchesFilters(listing, filters)), [listings, filters]);

  const { activeAll, compsAll } = useMemo(() => {
    const active: Listing[] = [];
    const comps: Listing[] = [];

    for (const listing of filteredBySchema) {
      if (isComparable(listing)) comps.push(listing);
      else active.push(listing);
    }

    return { activeAll: active, compsAll: comps };
  }, [filteredBySchema]);

  const activePricedAll = useMemo(() => activeAll.filter((listing) => (priceNum(listing.price_usd) ?? 0) > 0), [activeAll]);

  const computedPriceBounds = useMemo(() => {
    const visiblePriced = bounds ? activePricedAll.filter((listing) => inBounds(listing, bounds)) : activePricedAll;
    const source = visiblePriced.length >= 5 ? visiblePriced : activePricedAll;
    const prices = source.map((listing) => priceNum(listing.price_usd)).filter((v): v is number => v !== null);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [activePricedAll, bounds]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const { min, max } = computedPriceBounds;
    setPriceRange((prev) => {
      if (prev[0] === 0 && prev[1] === 0 && (min !== 0 || max !== 0)) return [min, max];
      return [clamp(prev[0], min, max), clamp(prev[1], min, max)].sort((a,b)=>a-b) as [number, number];
    });
  }, [computedPriceBounds]);

  useEffect(() => {
    setPriceRange([computedPriceBounds.min, computedPriceBounds.max]);
  }, [filters.listingType, filters.propertyTypes, computedPriceBounds.min, computedPriceBounds.max]);

  const filteredActive = useMemo(() => {
    const [minSelected, maxSelected] = priceRange;
    return activeAll.filter((listing) => {
      const price = priceNum(listing.price_usd);
      if (price === null) return true;
      return price >= minSelected && price <= maxSelected;
    });
  }, [activeAll, priceRange]);

  const filteredComps = useMemo(() => {
    const [minSelected, maxSelected] = priceRange;
    return compsAll.filter((listing) => {
      const price = priceNum(listing.price_usd);
      if (price === null) return true;
      return price >= minSelected && price <= maxSelected;
    });
  }, [compsAll, priceRange]);

  const listActiveInBounds = useMemo(() => {
    if (!hasUserMovedMap.current) return filteredActive;
    if (!bounds) return filteredActive;
    return filteredActive.filter((l) => inBounds(l, bounds));
  }, [filteredActive, bounds]);

  const listCompsInBounds = useMemo(() => {
    if (!hasUserMovedMap.current) return filteredComps;
    if (!bounds) return filteredComps;
    return filteredComps.filter((l) => inBounds(l, bounds));
  }, [filteredComps, bounds]);

  const visibleMarkerCount = useMemo(() => listActiveInBounds.length + (showComps ? listCompsInBounds.length : 0), [listActiveInBounds.length, listCompsInBounds.length, showComps]);

  const sliderMin = computedPriceBounds.min;
  const sliderMax = computedPriceBounds.max;
  const [minSelected, maxSelected] = priceRange;
  const step = filters.listingType === "rent" ? 50 : 1000;

  function roundStep(v: number) {
    return Math.round(v / step) * step;
  }

  // Refs and helper to ensure the active thumb is on top when handles overlap.
  // We bring the pointer-down/focus input to front so users can grab either handle.
  const minRef = useRef<HTMLInputElement | null>(null);
  const maxRef = useRef<HTMLInputElement | null>(null);

  function bringToFront(which: "min" | "max") {
    if (which === "min") {
      if (minRef.current) minRef.current.style.zIndex = "1000";
      if (maxRef.current) maxRef.current.style.zIndex = "500";
    } else {
      if (maxRef.current) maxRef.current.style.zIndex = "1000";
      if (minRef.current) minRef.current.style.zIndex = "500";
    }
  }

  function updateMin(v: number) {
    setPriceRange((prev) => {
      const clamped = Math.min(v, prev[1]);
      const rounded = roundStep(clamped);
      const finalMin = Math.min(rounded, prev[1]);
      return [finalMin, prev[1]];
    });
  }
  function updateMax(v: number) {
    setPriceRange((prev) => {
      const clamped = Math.max(v, prev[0]);
      const rounded = roundStep(clamped);
      const finalMax = Math.max(rounded, prev[0]);
      return [prev[0], finalMax];
    });
  }

  return (
<section className="flex flex-col md:flex-row gap-4">
    {/* Sidebar de filtros */}
    <aside className="w-full md:w-56 flex-shrink-0 flex flex-col gap-3">
      <div className="flex overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <button type="button" onClick={()=>setFilters(prev=>({...prev, listingType: prev.listingType==='sale'? '': 'sale'}))} className={"flex-1 px-2 py-1 text-sm transition-colors "+(filters.listingType==='sale'? 'bg-blue-600 text-white':'text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900')}>{t.buy}</button>
        <button type="button" onClick={()=>setFilters(prev=>({...prev, listingType: prev.listingType==='rent'? '': 'rent'}))} className={"flex-1 px-2 py-1 text-sm transition-colors "+(filters.listingType==='rent'? 'bg-blue-600 text-white':'text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900')}>{t.rent}</button>
      </div>

      <button type="button" className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-left text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900">
        🧭 {t.useMyLocation}
      </button>

      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t.category}</label>
      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setFilters(prev => {
                const selected = [...prev.propertyTypes];
                if (selected.includes(cat)) {
                  selected.splice(selected.indexOf(cat), 1);
                } else {
                  selected.push(cat);
                }
                return { ...prev, propertyTypes: selected };
              });
            }}
            className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filters.propertyTypes.includes(cat) ? "bg-blue-600 text-white" : "bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"}`}
          >
            {t[cat]}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-xs font-medium">{t.priceRange}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">${Number(minSelected).toLocaleString()} – ${Number(maxSelected).toLocaleString()}</div>
        </div>
        <div className="relative h-8 mt-2">
          <input
            ref={(el) => { minRef.current = el }}
            aria-label={t.minPrice}
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={step}
            value={minSelected}
            onChange={(e) => updateMin(Number(e.target.value))}
            onPointerDown={() => bringToFront("min")}
            onFocus={() => bringToFront("min")}
            className="uplat-range absolute inset-0 w-full bg-transparent"
            disabled={sliderMin === sliderMax}
          />
          <input
            ref={(el) => { maxRef.current = el }}
            aria-label={t.maxPrice}
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={step}
            value={maxSelected}
            onChange={(e) => updateMax(Number(e.target.value))}
            onPointerDown={() => bringToFront("max")}
            onFocus={() => bringToFront("max")}
            className="uplat-range absolute inset-0 w-full bg-transparent"
            disabled={sliderMin === sliderMax}
          />
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div className="relative h-1 w-full rounded bg-zinc-200 dark:bg-zinc-800">
              <div className="absolute h-1 rounded bg-black dark:bg-white" style={{ left: `${((minSelected-sliderMin)/Math.max(1,sliderMax-sliderMin))*100}%`, right: `${100-((maxSelected-sliderMin)/Math.max(1,sliderMax-sliderMin))*100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" checked={showComps} onChange={(e)=>setShowComps(e.target.checked)} />
        {t.showComps}
      </label>
    </aside>

    <main className="flex-1 flex flex-col gap-4">
      <LeafletMap
        activeListings={listActiveInBounds}
        compListings={listCompsInBounds}
        showComps={showComps}
        center={center ?? undefined}
        basePath={basePath}
        openLabel={t.viewListing}
        onBoundsChange={handleBoundsChange}
        visibleCount={visibleMarkerCount}
        onMarkerHover={(id) => setHoveredListingId(id)}
      />

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {t.errorLoadingListings(err)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {listActiveInBounds.map((listing) => {
          const beds = listing.beds ?? null;
          const baths = listing.baths ?? null;
          const area = listing.area_m2 ?? null;
          const stats = [beds !== null ? t.bedsShort(beds) : null, baths !== null ? t.bathsShort(baths) : null, area !== null ? t.areaShort(area) : null].filter(Boolean);
          return (
            <Link
              key={listing.id}
              href={`${basePath}/listing/${listing.id}`}
              className={`grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 transition-all duration-200 ${hoveredListingId === listing.id ? 'ring-1 ring-blue-500/30 shadow-sm translateY(-1px)' : ''}`}
            >
              <div className="relative h-40 w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
  {getPrimaryImage(listing) ? (
    <img src={getPrimaryImage(listing)!} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="flex h-full items-center justify-center text-xs text-zinc-500">{t.noImage}</div>
  )}
  <div className="absolute right-2 top-2">
    <FavoriteButton listingId={listing.id} initialCount={(listing as any).favorites_count ?? 0} />
  </div>
</div>
              <div className="flex-1">
                <div className="font-semibold">{listing.headline || listing.title}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">${Number(listing.price_usd ?? 0).toLocaleString()} • {listing.city}{stats.length ? ` • ${stats.join(" • ")}` : ''}</div>
                {/* Ownership */}
                {(listing as any).profiles?.[0] && (() => {
                  const p = (listing as any).profiles[0];
                  if (p.role === 'realtor') {
                    const agency = p.agencies?.[0]?.name;
                    return agency
                      ? <div className="text-xs text-zinc-500">{p.full_name} • {agency}</div>
                      : <div className="text-xs text-zinc-500">{p.full_name}</div>;
                  }
                  return <div className="text-xs text-zinc-500">{t.listedByOwner || 'Listed by owner'}</div>;
                })()}
              </div>
            </Link>
          );
        })}

        {showComps && listCompsInBounds.length ? (
          <div className="mt-2 grid gap-2 md:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.compsLabel}</div>
            {listCompsInBounds.map((listing) => {
              const beds = listing.beds ?? null;
              const baths = listing.baths ?? null;
              const area = listing.area_m2 ?? null;
              const stats = [beds !== null ? t.bedsShort(beds) : null, baths !== null ? t.bathsShort(baths) : null, area !== null ? t.areaShort(area) : null].filter(Boolean);
              return (
                <div key={`comp_card_${listing.id}`} className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200">
                  <div className="relative h-32 w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 opacity-90">
  {getPrimaryImage(listing) ? (
    <img src={getPrimaryImage(listing)!} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="flex h-full items-center justify-center text-xs text-zinc-500 opacity-90">{t.noImage}</div>
  )}
</div>
                  <div className="font-semibold opacity-80">{listing.title}</div>
                  <div className="text-sm opacity-80">${Number(listing.price_usd ?? 0).toLocaleString()} • {listing.city}{stats.length ? ` • ${stats.join(" • ")}` : ''}</div>
                  {/* Ownership for comps */}
                  {(listing as any).profiles?.[0] && (() => {
                    const p = (listing as any).profiles[0];
                    if (p.role === 'realtor') {
                      const agency = p.agencies?.[0]?.name;
                      return agency
                        ? <div className="text-xs opacity-70">{p.full_name} • {agency}</div>
                        : <div className="text-xs opacity-70">{p.full_name}</div>;
                    }
                    return <div className="text-xs opacity-70">{t.listedByOwner || 'Listed by owner'}</div>;
                  })()}
                  <div className="text-xs opacity-70">{t.compsHint}</div>
                </div>
              );
            })}
          </div>
        ) : null}

        {!loading && listActiveInBounds.length === 0 && (!showComps || listCompsInBounds.length === 0) && (
          <div className="col-span-full text-center py-12">
            <p className="text-zinc-700 dark:text-zinc-200">{t.noListings}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.noListingsSub}</p>
          </div>
        )}
      </div>
    </main>
  </section>
);
}
