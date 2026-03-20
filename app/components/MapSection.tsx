"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type L from "leaflet";

import { getSupabaseClient } from "@/lib/supabaseClient";
import UseMyLocationButton from "@/app/components/UseMyLocationButton";
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
  city: string;
  mode: string;
  type: string;
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

export default function MapSection({
  locale,
  basePath,
}: {
  locale: "es" | "en";
  basePath: "" | "/en";
}) {
  const t = locale === "en" ? en : es;
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<Filters>({ city: "", mode: "", type: "" });
  const [center, setCenter] = useState<[number, number] | null>(null);

  const [showComps, setShowComps] = useState(false);
  const [bounds, setBounds] = useState<BoundsBox | null>(null);

  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const supabase = getSupabaseClient();
        let q = supabase.from("listings").select("*").order("created_at", { ascending: false });
        if (filters.city) q = q.eq("city", filters.city);
        if (filters.mode) q = q.eq("mode", filters.mode);
        if (filters.type) q = q.eq("type", filters.type);

        const { data, error } = await q;
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
  }, [filters.city, filters.mode, filters.type]);

  const { activeAll, compsAll } = useMemo(() => {
    const act: Listing[] = [];
    const comps: Listing[] = [];
    for (const l of listings) {
      if ((l.status ?? "active") === "comp") comps.push(l);
      else act.push(l);
    }
    return { activeAll: act, compsAll: comps };
  }, [listings]);

  const activePricedAll = useMemo(
    () => activeAll.filter((l) => (priceNum(l.price_usd) ?? 0) > 0),
    [activeAll]
  );

  // Hybrid rule for slider range:
  // - if there are >=5 priced active listings in current bounds → use visible range
  // - else → use full active range
  const computedPriceBounds = useMemo(() => {
    const visiblePriced = bounds
      ? activePricedAll.filter((l) => inBounds(l, bounds))
      : activePricedAll;

    const src = visiblePriced.length >= 5 ? visiblePriced : activePricedAll;
    const prices = src.map((l) => priceNum(l.price_usd)).filter((p): p is number => p !== null);

    if (prices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [activePricedAll, bounds]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);

  // When computed bounds change (pan/zoom/filters), clamp selection.
  useEffect(() => {
    const { min, max } = computedPriceBounds;
    setPriceRange((prev) => {
      // First time init
      if (prev[0] === 0 && prev[1] === 0 && (min !== 0 || max !== 0)) return [min, max];
      return [clamp(prev[0], min, max), clamp(prev[1], min, max)].sort((a, b) => a - b) as [
        number,
        number,
      ];
    });
  }, [computedPriceBounds]);

  const filteredActive = useMemo(() => {
    const [minSel, maxSel] = priceRange;
    return activeAll.filter((l) => {
      const p = priceNum(l.price_usd);
      if (p === null) return true; // keep unknown-priced listings visible
      return p >= minSel && p <= maxSel;
    });
  }, [activeAll, priceRange]);

  const filteredComps = useMemo(() => {
    const [minSel, maxSel] = priceRange;
    return compsAll.filter((l) => {
      const p = priceNum(l.price_usd);
      if (p === null) return true;
      return p >= minSel && p <= maxSel;
    });
  }, [compsAll, priceRange]);

  const listActiveInBounds = useMemo(
    () => filteredActive.filter((l) => inBounds(l, bounds)),
    [filteredActive, bounds]
  );
  const listCompsInBounds = useMemo(
    () => filteredComps.filter((l) => inBounds(l, bounds)),
    [filteredComps, bounds]
  );

  const count = useMemo(() => filteredActive.length + (showComps ? filteredComps.length : 0), [
    filteredActive.length,
    filteredComps.length,
    showComps,
  ]);

  const sliderMin = computedPriceBounds.min;
  const sliderMax = computedPriceBounds.max;

  const [minSel, maxSel] = priceRange;

  function updateMin(v: number) {
    setPriceRange((prev) => [Math.min(v, prev[1]), prev[1]]);
  }
  function updateMax(v: number) {
    setPriceRange((prev) => [prev[0], Math.max(v, prev[0])]);
  }

  const openLabel = basePath === "/en" ? "Open" : "Ver";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{t.browseListings}</h2>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {loading ? t.loading : t.listingsCount(count)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <UseMyLocationButton
          label={t.useMyLocation}
          onLocation={(lat, lng) => setCenter([lat, lng])}
        />
        <select
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={filters.city}
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
        >
          <option value="">{t.allCities}</option>
          <option value="Managua">Managua</option>
          <option value="San Juan del Sur">San Juan del Sur</option>
          <option value="Granada">Granada</option>
        </select>

        <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, mode: f.mode === "buy" ? "" : "buy" }))}
            className={
              "px-3 py-1 text-sm transition-colors " +
              (filters.mode === "buy"
                ? "bg-blue-600 text-white"
                : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900")
            }
          >
            {t.buy}
          </button>
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, mode: f.mode === "rent" ? "" : "rent" }))}
            className={
              "px-3 py-1 text-sm transition-colors " +
              (filters.mode === "rent"
                ? "bg-blue-600 text-white"
                : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900")
            }
          >
            {t.rent}
          </button>
        </div>

        <select
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">{t.allTypes}</option>
          <option value="house">{t.house}</option>
          <option value="land">{t.land}</option>
          <option value="apartment">{t.apartment}</option>
        </select>

        <label className="ml-auto inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={showComps}
            onChange={(e) => setShowComps(e.target.checked)}
          />
          {t.showComps}
        </label>
      </div>

      <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-medium">{t.priceRange}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            ${Number(minSel).toLocaleString()} – ${Number(maxSel).toLocaleString()}
          </div>
        </div>

        <div className="relative h-10">
          <input
            aria-label={t.minPrice}
            type="range"
            min={sliderMin}
            max={sliderMax}
            value={minSel}
            onChange={(e) => updateMin(Number(e.target.value))}
            className="absolute inset-0 w-full"
            disabled={sliderMin === sliderMax}
          />
          <input
            aria-label={t.maxPrice}
            type="range"
            min={sliderMin}
            max={sliderMax}
            value={maxSel}
            onChange={(e) => updateMax(Number(e.target.value))}
            className="absolute inset-0 w-full"
            disabled={sliderMin === sliderMax}
          />
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          {t.priceRangeHint}
        </div>
      </div>

      <LeafletMap
        activeListings={filteredActive}
        compListings={filteredComps}
        showComps={showComps}
        center={center ?? undefined}
        basePath={basePath}
        openLabel={openLabel}
        onBoundsChange={(b) => setBounds(toBoundsBox(b))}
      />

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {t.errorLoadingListings(err)}
        </div>
      ) : null}

      <div className="grid gap-2">
        {listActiveInBounds.map((l) => {
          const beds = l.beds ?? null;
          const baths = l.baths ?? null;
          const area = l.area_m2 ?? null;
          const stats = [
            beds !== null ? t.bedsShort(beds) : null,
            baths !== null ? t.bathsShort(baths) : null,
            area !== null ? t.areaShort(area) : null,
          ].filter(Boolean);

          return (
            <Link
              key={l.id}
              href={`${basePath}/listing/${l.id}`}
              className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              {l.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.cover_image_url}
                  alt={l.title}
                  className="h-40 w-full rounded-lg object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="font-semibold">{l.title}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                ${Number(l.price_usd ?? 0).toLocaleString()} • {l.city}
                {stats.length ? ` • ${stats.join(" • ")}` : ""}
              </div>
            </Link>
          );
        })}

        {showComps && listCompsInBounds.length ? (
          <div className="mt-2 grid gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t.compsLabel}
            </div>
            {listCompsInBounds.map((l) => {
              const beds = l.beds ?? null;
              const baths = l.baths ?? null;
              const area = l.area_m2 ?? null;
              const stats = [
                beds !== null ? t.bedsShort(beds) : null,
                baths !== null ? t.bathsShort(baths) : null,
                area !== null ? t.areaShort(area) : null,
              ].filter(Boolean);

              return (
                <div
                  key={`comp_card_${l.id}`}
                  className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200"
                >
                  {l.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.cover_image_url}
                      alt={l.title}
                      className="h-32 w-full rounded-lg object-cover opacity-90"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="font-semibold opacity-80">{l.title}</div>
                  <div className="text-sm opacity-80">
                    ${Number(l.price_usd ?? 0).toLocaleString()} • {l.city}
                    {stats.length ? ` • ${stats.join(" • ")}` : ""}
                  </div>
                  <div className="text-xs opacity-70">{t.compsHint}</div>
                </div>
              );
            })}
          </div>
        ) : null}

        {!loading && listActiveInBounds.length === 0 && (!showComps || listCompsInBounds.length === 0) ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.noListings}</div>
        ) : null}
      </div>
    </section>
  );
}
