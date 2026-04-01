"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
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
    const supabase = getSupabaseClient();
    const visitor_id = getOrCreateVisitorId();

    // Fire-and-forget view event
    supabase
      .from("events")
      .insert({ type: "listing_view", listing_id: listingId, meta: { visitor_id } })
      .then(({ error }) => {
        if (error) {
          console.error('[TrackListingView] insert event failed:', error);
        } else {
          console.log('[TrackListingView] event inserted', { listingId, visitor_id });
        }
        return supabase.rpc("get_listing_views", { listing: listingId });
      })
      .then(({ data, error }) => {
        if (error) {
          console.error('[TrackListingView] get_listing_views error:', error);
          setViews(0);
          return;
        }
        const count = Number(data ?? 0);
        console.log('[TrackListingView] get_listing_views result:', count);
        setViews(count);
      })
      .catch((err) => {
        console.error('[TrackListingView] unexpected error:', err);
        setViews(0);
      });
  }, [listingId]);

  return (
    <div className="text-xs text-zinc-600 dark:text-zinc-400">{t.views(views)}</div>
  );
}
