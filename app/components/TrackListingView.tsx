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
    const visitorId = getOrCreateVisitorId();

    async function run() {
      try {
        const existingRes = await supabase
          .from('events')
          .select('id')
          .eq('type', 'listing_view')
          .eq('listing_id', listingId)
          .eq('meta->>visitor_id', visitorId)
          .limit(1)
          .maybeSingle();

        if (existingRes.error) {
          console.error('[TrackListingView] check error:', existingRes.error);
        }

        if (!existingRes.data) {
          const { error: insertErr } = await supabase.from('events').insert({
            type: 'listing_view',
            listing_id: listingId,
            meta: { visitor_id: visitorId },
          });
          if (insertErr) {
            console.error('[TrackListingView] insert error:', insertErr);
          }
        }

        const countRes = await supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'listing_view')
          .eq('listing_id', listingId);

        if (countRes.error) {
          console.error('[TrackListingView] count error:', countRes.error);
          setViews(0);
          return;
        }

        setViews(countRes.count ?? 0);
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
