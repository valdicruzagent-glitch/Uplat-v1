"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import UseMyLocationButton from "@/app/components/UseMyLocationButton";
import type { Listing } from "@/app/types/listing";

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

import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";

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

  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const supabase = getSupabaseClient();
        let q = supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });
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

  const count = useMemo(() => listings.length, [listings]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{t.browseListings}</h2>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {loading ? t.loading : t.listingsCount(count)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
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
            onClick={() =>
              setFilters((f) => ({ ...f, mode: f.mode === "buy" ? "" : "buy" }))
            }
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
            onClick={() =>
              setFilters((f) => ({ ...f, mode: f.mode === "rent" ? "" : "rent" }))
            }
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
      </div>

      <LeafletMap
        listings={listings}
        center={center ?? undefined}
        basePath={basePath}
        openLabel={basePath === "/en" ? "Open" : "Ver"}
      />

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {t.errorLoadingListings(err)}
        </div>
      ) : null}

      <div className="grid gap-2">
        {listings.map((l) => (
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
              ${Number(l.price_usd).toLocaleString()} • {l.city} • {l.type} • {l.mode}
            </div>
          </Link>
        ))}

        {!loading && listings.length === 0 ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.noListings}</div>
        ) : null}
      </div>
    </section>
  );
}
