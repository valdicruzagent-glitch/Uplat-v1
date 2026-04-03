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

    // Check if view already recorded for this visitor/listing
    supabase
      .from('events')
      .select('id')
      .eq('type', 'listing_view')
      .eq('listing_id', listingId)
      .eq('meta->>visitor_id', visitor_id)
      .maybeSingle()
      .then(async (res: { data: any; error: any }) => {
        const existing = res.data;
        const checkErr = res.error;
        if (checkErr) {
          console.error('[TrackListingView] check error:', checkErr);
        }
        // Insert only if not exists
        if (!existing) {
          const { error: insertErr } = await supabase.from('events').insert({
            type: 'listing_view',
            listing_id: listingId,
            meta: { visitor_id },
          });
          if (insertErr) {
            console.error('[TrackListingView] insert error:', insertErr);
          } else {
            console.log('[TrackListingView] event recorded', { listingId, visitor_id });
          }
        } else {
          console.log('[TrackListingView] already viewed', { listingId, visitor_id });
        }
        // Fetch latest count
        const { data, error } = await supabase.rpc('get_listing_views', { listing: listingId });
        if (error) {
          console.error('[TrackListingView] get_listing_views error:', error);
          const fallback = await supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'listing_view')
            .eq('listing_id', listingId);
          setViews(fallback.count ?? 0);
          return;
        }
        const count = Number(data ?? 0);
        if (count <= 0) {
          const fallback = await supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'listing_view')
            .eq('listing_id', listingId);
          setViews(fallback.count ?? 0);
          return;
        }
        console.log('[TrackListingView] count:', count);
        setViews(count);
      })
      .catch((err: any) => {
        console.error('[TrackListingView] unexpected error:', err);
        setViews(0);
      });
  }, [listingId]);

  return (
    <div className="text-xs text-zinc-600 dark:text-zinc-400">{t.views(views)}</div>
  );
}
