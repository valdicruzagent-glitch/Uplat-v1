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
import type L from "leaflet";

import { getSupabaseClient } from "@/lib/supabaseClient";

import type { Listing } from "@/app/types/listing";

import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";

const LeafletMap = dynamic(() => import("@/app/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950" />
  ),
});

type Filters = {
  listingType: "" | "sale" | "rent";
  propertyType: "" | "house" | "land" | "apartment";
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
  if (listing.image_urls?.length) return listing.image_urls[0] ?? null;
  return listing.cover_image_url ?? null;
}

function isComparable(listing: Listing) {
  return listing.status === "comp" || listing.meta?.comparable === true;
}

function matchesFilters(listing: Listing, filters: Filters) {
  if (filters.listingType && getListingType(listing) !== filters.listingType) return false;
  if (filters.propertyType && getPropertyType(listing) !== filters.propertyType) return false;
  return true;
}

export default function MapSection({
  locale,
  basePath,
  center,
}: {
  locale: "es" | "en";
  basePath: "" | "/en";
  center: [number, number] | null;
}) {
  const t = locale === "en" ? en : es;
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<Filters>({ listingType: "", propertyType: "" });
  const [showComps, setShowComps] = useState(false);
  const [bounds, setBounds] = useState<BoundsBox | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

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
  }, [filters.listingType, filters.propertyType, computedPriceBounds.min, computedPriceBounds.max]);

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

  const listActiveInBounds = useMemo(() => filteredActive.filter((l) => inBounds(l, bounds)), [filteredActive, bounds]);
  const listCompsInBounds = useMemo(() => filteredComps.filter((l) => inBounds(l, bounds)), [filteredComps, bounds]);

  const count = useMemo(() => filteredActive.length + (showComps ? filteredComps.length : 0), [filteredActive.length, filteredComps.length, showComps]);

  const sliderMin = computedPriceBounds.min;
  const sliderMax = computedPriceBounds.max;
  const [minSelected, maxSelected] = priceRange;

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

  function updateMin(v: number) { setPriceRange((prev) => [Math.min(v, prev[1]), prev[1]]); }
  function updateMax(v: number) { setPriceRange((prev) => [prev[0], Math.max(v, prev[0])]); }

  return (
    <section className="flex flex-col gap-4">

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <button type="button" onClick={()=>setFilters(prev=>({...prev, listingType: prev.listingType==='sale'? '': 'sale'}))} className={"px-3 py-1 text-sm transition-colors "+(filters.listingType==='sale'? 'bg-blue-600 text-white':'text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900')}>{t.buy}</button>
          <button type="button" onClick={()=>setFilters(prev=>({...prev, listingType: prev.listingType==='rent'? '': 'rent'}))} className={"px-3 py-1 text-sm transition-colors "+(filters.listingType==='rent'? 'bg-blue-600 text-white':'text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900')}>{t.rent}</button>
        </div>

        <select className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={filters.propertyType} onChange={(e)=>setFilters(prev=>({...prev, propertyType: e.target.value as Filters['propertyType']}))}>
          <option value="">{t.allTypes}</option>
          <option value="house">{t.house}</option>
          <option value="land">{t.land}</option>
          <option value="apartment">{t.apartment}</option>
        </select>
        <div className="inline-flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 w-64">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-xs font-medium">{t.priceRange}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">${Number(minSelected).toLocaleString()} – ${Number(maxSelected).toLocaleString()}</div>
          </div>
          <div className="relative h-8">
            <input
              ref={(el) => { minRef.current = el }}
              aria-label={t.minPrice}
              type="range"
              min={sliderMin}
              max={sliderMax}
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

        <label className="ml-auto inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"><input type="checkbox" checked={showComps} onChange={(e)=>setShowComps(e.target.checked)} />{t.showComps}</label>
      </div>

      <LeafletMap activeListings={filteredActive} compListings={filteredComps} showComps={showComps} center={center ?? undefined} basePath={basePath} openLabel={basePath==='/en' ? 'Open' : 'Ver'} onBoundsChange={(box)=>setBounds(toBoundsBox(box))} />

      {err ? (<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">{t.errorLoadingListings(err)}</div>) : null}

      <div className="grid gap-2">{listActiveInBounds.map((listing)=>{const beds=listing.beds??null;const baths=listing.baths??null;const area=listing.area_m2??null;const stats=[beds!==null? t.bedsShort(beds):null,baths!==null? t.bathsShort(baths):null,area!==null? t.areaShort(area):null].filter(Boolean);return (<Link key={listing.id} href={`${basePath}/listing/${listing.id}`} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">{getPrimaryImage(listing)?(<img src={getPrimaryImage(listing)??undefined} alt={listing.title} className="h-40 w-full rounded-lg object-cover" loading="lazy" />):null}<div className="font-semibold">{listing.headline||listing.title}</div><div className="text-sm text-zinc-600 dark:text-zinc-400">${Number(listing.price_usd??0).toLocaleString()} • {listing.city}{stats.length?` • ${stats.join(" • ")}`:''}</div></Link>);})}

        {showComps && listCompsInBounds.length ? (<div className="mt-2 grid gap-2"><div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.compsLabel}</div>{listCompsInBounds.map((listing)=>{const beds=listing.beds??null;const baths=listing.baths??null;const area=listing.area_m2??null;const stats=[beds!==null? t.bedsShort(beds):null,baths!==null? t.bathsShort(baths):null,area!==null? t.areaShort(area):null].filter(Boolean);return (<div key={`comp_card_${listing.id}`} className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200">{getPrimaryImage(listing)?(<img src={getPrimaryImage(listing)??undefined} alt={listing.title} className="h-32 w-full rounded-lg object-cover opacity-90" loading="lazy"/>):null}<div className="font-semibold opacity-80">{listing.title}</div><div className="text-sm opacity-80">${Number(listing.price_usd??0).toLocaleString()} • {listing.city}{stats.length?` • ${stats.join(" • ")}`:''}</div><div className="text-xs opacity-70">{t.compsHint}</div></div>);})}</div>) : null}

        {!loading && listActiveInBounds.length===0 && (!showComps || listCompsInBounds.length===0) ? (<div className="text-sm text-zinc-600 dark:text-zinc-400">{t.noListings}</div>):null}
      </div>
    </section>
  );
}
