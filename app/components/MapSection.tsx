"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/app/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950" />
  ),
});

export default function MapSection() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-medium">Map</h2>
      <LeafletMap />
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        If you see tiles + a marker popup, the Leaflet + react-leaflet setup is
        good.
      </p>
    </section>
  );
}
