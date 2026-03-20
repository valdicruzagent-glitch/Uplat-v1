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

export default function MapSection() {
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
        <h2 className="text-base font-semibold">Browse listings</h2>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {loading ? "Loading…" : `${count} listings`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <UseMyLocationButton onLocation={(lat, lng) => setCenter([lat, lng])} />
        <select
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={filters.city}
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
        >
          <option value="">All cities</option>
          <option value="Managua">Managua</option>
          <option value="San Juan del Sur">San Juan del Sur</option>
          <option value="Granada">Granada</option>
        </select>

        <select
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={filters.mode}
          onChange={(e) => setFilters((f) => ({ ...f, mode: e.target.value }))}
        >
          <option value="">Buy + Rent</option>
          <option value="buy">Buy</option>
          <option value="rent">Rent</option>
        </select>

        <select
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">All types</option>
          <option value="house">House</option>
          <option value="land">Land</option>
          <option value="apartment">Apartment</option>
        </select>
      </div>

      <LeafletMap listings={listings} center={center ?? undefined} />

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          Error loading listings: {err}
        </div>
      ) : null}

      <div className="grid gap-2">
        {listings.map((l) => (
          <Link
            key={l.id}
            href={`/listing/${l.id}`}
            className="block rounded-xl border border-zinc-200 bg-white p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <div className="font-semibold">{l.title}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              ${Number(l.price_usd).toLocaleString()} • {l.city} • {l.type} • {l.mode}
            </div>
          </Link>
        ))}

        {!loading && listings.length === 0 ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            No listings yet. Seed a few in Supabase → table <code>listings</code>.
          </div>
        ) : null}
      </div>
    </section>
  );
}
