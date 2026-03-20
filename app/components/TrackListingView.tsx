"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getOrCreateVisitorId } from "@/app/lib/visitor";

export default function TrackListingView({ listingId }: { listingId: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const visitor_id = getOrCreateVisitorId();

    // Fire-and-forget view event
    supabase
      .from("events")
      .insert({ type: "listing_view", listing_id: listingId, meta: { visitor_id } })
      .then(() => {
        // Fetch latest count
        return supabase.rpc("get_listing_views", { listing: listingId });
      })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        setViews(Number(data ?? 0));
      });
  }, [listingId]);

  if (views === null) {
    return (
      <div className="text-xs text-zinc-600 dark:text-zinc-400">Views: …</div>
    );
  }

  return (
    <div className="text-xs text-zinc-600 dark:text-zinc-400">Views: {views}</div>
  );
}
