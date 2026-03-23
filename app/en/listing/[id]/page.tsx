import LanguageSwitch from "@/app/components/LanguageSwitch";
import Link from "next/link";
import TrackListingView from "@/app/components/TrackListingView";
import { en } from "@/app/i18n/en";
import { getSupabaseClient } from "@/lib/supabaseClient";

/**
 * Public listing detail page (English).
 *
 * What this file does:
 * - Loads one listing from Supabase.
 * - Renders the English detail experience.
 * - Builds the WhatsApp call to action for lead capture.
 *
 * Safe edit note:
 * - This file supports both canonical V1 fields and legacy fields during migration.
 * - Keep the compatibility helpers until the migration is fully deployed.
 */
function getPrimaryImage(listing: Record<string, unknown>) {
  const imageUrls = Array.isArray(listing.image_urls) ? listing.image_urls : null;
  if (imageUrls?.length && typeof imageUrls[0] === "string") return imageUrls[0];
  return typeof listing.cover_image_url === "string" ? listing.cover_image_url : null;
}

function getListingType(listing: Record<string, unknown>) {
  if (typeof listing.listing_type === "string") return listing.listing_type;
  if (listing.mode === "buy") return "sale";
  if (listing.mode === "rent") return "rent";
  return "sale";
}

function getPropertyType(listing: Record<string, unknown>) {
  if (typeof listing.property_type === "string") return listing.property_type;
  if (typeof listing.type === "string") return listing.type;
  return "house";
}

export default async function ListingPageEn({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = getSupabaseClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !listing) {
    return (
      <main className="min-h-dvh bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <Link className="text-sm underline" href="/en">
              {en.back}
            </Link>
            <LanguageSwitch current="en" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">{en.listingNotFound}</h1>
        </div>
      </main>
    );
  }

  const priceText = listing.price_usd ? `$${Number(listing.price_usd).toLocaleString()}` : "—";
  const title = listing.headline || listing.title;
  const propertyType = getPropertyType(listing);
  const listingType = getListingType(listing);
  const primaryImage = getPrimaryImage(listing);
  const contactWhatsapp = typeof listing.contact_whatsapp === "string" ? listing.contact_whatsapp : "505XXXXXXXX";

  const msg = encodeURIComponent(
    `Hi, I'm interested in: ${listing.title} in ${listing.city}. Price: ${priceText}.`
  );
  const wa = `https://wa.me/${contactWhatsapp.replace(/\D/g, "")}?text=${msg}`;

  return (
    <main className="min-h-dvh bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage}
            alt={String(title)}
            className="h-64 w-full rounded-xl object-cover"
          />
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <Link className="text-sm underline" href="/en">
            {en.back}
          </Link>
          <LanguageSwitch current="en" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {priceText} • {listing.city} • {propertyType} • {listingType}
          {typeof listing.beds === "number" ? ` • ${en.bedsShort(listing.beds)}` : ""}
          {typeof listing.baths === "number" ? ` • ${en.bathsShort(listing.baths)}` : ""}
          {typeof listing.area_m2 === "number" ? ` • ${en.areaShort(listing.area_m2)}` : ""}
        </p>
        <TrackListingView listingId={listing.id} locale="en" />

        {listing.description ? <p className="text-sm leading-6">{listing.description}</p> : null}

        {listing.status !== "archived" ? (
          <a
            className="mt-2 inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href={wa}
            target="_blank"
            rel="noreferrer"
          >
            {en.contactWhatsapp}
          </a>
        ) : null}
      </div>
    </main>
  );
}
