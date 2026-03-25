import LanguageSwitch from "@/app/components/LanguageSwitch";
import Link from "next/link";
import TrackListingView from "@/app/components/TrackListingView";
import { es } from "@/app/i18n/es";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ImageGallery from "@/app/components/ImageGallery";
import FavoriteButton from "@/app/components/FavoriteButton";

/**
 * Public listing detail page (Spanish).
 *
 * What this file does:
 * - Loads one listing from Supabase.
 * - Renders the property detail view.
 * - Builds the WhatsApp call to action for lead capture.
 *
 * Safe edit note:
 * - This file supports both canonical V1 fields and legacy fields during migration.
 * - Keep the compatibility helpers until the migration is fully deployed.
 */
function getSortedImages(listing: Record<string, unknown>) {
  const images = Array.isArray(listing.listing_images) ? listing.listing_images : [];
  return [...images].sort((a: any, b: any) => a.sort_order - b.sort_order);
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

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = getSupabaseClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), favorites_count, is_sponsored, sponsor_rank, sponsored_until")
    .eq("id", id)
    .single();

  if (error || !listing) {
    return (
      <main className="min-h-dvh bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <Link className="text-sm underline" href="/">
              {es.back}
            </Link>
            <LanguageSwitch current="es" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">{es.listingNotFound}</h1>
        </div>
      </main>
    );
  }

  const priceText = listing.price_usd ? `$${Number(listing.price_usd).toLocaleString()}` : "—";
  const title = listing.headline || listing.title;
  const propertyType = getPropertyType(listing);
  const listingType = getListingType(listing);
  // Image handling with listing_images
  const sortedImages = getSortedImages(listing);
  const hasMultiple = sortedImages.length > 0;
  const primaryIdx = sortedImages.findIndex((img: any) => img.is_primary);
  const initialIndex = primaryIdx !== -1 ? primaryIdx : 0;
  const fallbackPrimaryImage = (() => {
    const imageUrls = Array.isArray(listing.image_urls) ? listing.image_urls : null;
    if (imageUrls?.length && typeof imageUrls[0] === "string") return imageUrls[0];
    return typeof listing.cover_image_url === "string" ? listing.cover_image_url : null;
  })();
  const contactWhatsapp = typeof listing.contact_whatsapp === "string" ? listing.contact_whatsapp : "505XXXXXXXX";

  const msg = encodeURIComponent(
    `Hola, estoy interesado en: ${listing.title} en ${listing.city}. Precio: ${priceText}.`
  );
  const wa = `https://wa.me/${contactWhatsapp.replace(/\D/g, "")}?text=${msg}`;

  return (
    <main className="min-h-dvh bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {hasMultiple ? (
          <ImageGallery images={sortedImages} initialIndex={initialIndex} />
        ) : fallbackPrimaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallbackPrimaryImage}
            alt={String(title)}
            className="h-64 w-full rounded-xl object-cover"
          />
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <Link className="text-sm underline" href="/">
            {es.back}
          </Link>
          <LanguageSwitch current="es" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <FavoriteButton listingId={listing.id} initialCount={listing.favorites_count ?? 0} />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {priceText} • {listing.city} • {propertyType} • {listingType}
          {typeof listing.beds === "number" ? ` • ${es.bedsShort(listing.beds)}` : ""}
          {typeof listing.baths === "number" ? ` • ${es.bathsShort(listing.baths)}` : ""}
          {typeof listing.area_m2 === "number" ? ` • ${es.areaShort(listing.area_m2)}` : ""}
        </p>
        <TrackListingView listingId={listing.id} locale="es" />

        {listing.description ? <p className="text-sm leading-6">{listing.description}</p> : null}

        {listing.status !== "archived" ? (
          <a
            className="mt-2 inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href={wa}
            target="_blank"
            rel="noreferrer"
          >
            {es.contactWhatsapp}
          </a>
        ) : null}
      </div>
    </main>
  );
}
