"use client";

import { useEffect, useState } from "react";
import { getOrCreateVisitorId } from "@/app/lib/visitor";

import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";

export default function TrackListingView({
  listingId,
  locale,
}: {
  listingId: string;
  locale: "es" | "en";
}) {
  const t = locale === "en" ? en : es;
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();

    async function run() {
      try {
        const res = await fetch('/api/listing-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, visitorId }),
        });

        if (!res.ok) {
          const fallback = await fetch(`/api/listing-views?listingId=${encodeURIComponent(listingId)}`);
          if (!fallback.ok) {
            setViews(0);
            return;
          }
          const fallbackData = await fallback.json();
          setViews(Number(fallbackData.count ?? 0));
          return;
        }

        const data = await res.json();
        setViews(Number(data.count ?? 0));
      } catch (err) {
        console.error('[TrackListingView] unexpected error:', err);
        setViews(0);
      }
    }

    run();
  }, [listingId]);

  return (
    <div className="text-xs text-zinc-600 dark:text-zinc-400">{t.views(views)}</div>
  );
}
