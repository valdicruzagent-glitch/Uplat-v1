import LanguageSwitch from "@/app/components/LanguageSwitch";
import Link from "next/link";
import TrackListingView from "@/app/components/TrackListingView";
import { en } from "@/app/i18n/en";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ImageGallery from "@/app/components/ImageGallery";
import FavoriteButton from "@/app/components/FavoriteButton";

function getSortedImages(listing: Record<string, unknown>) {
  const urls = Array.isArray(listing.image_urls) ? listing.image_urls : [];
  return urls.map((url: string, idx: number) => ({
    id: `img-${idx}`,
    image_url: url,
    sort_order: idx,
    is_primary: idx === 0,
    listing_id: listing.id as string,
    created_at: new Date().toISOString(),
  }));
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
    .select(`
      *,
      favorites_count,
      is_sponsored,
      sponsor_rank,
      sponsored_until,
      profiles (
        id,
        full_name,
        role,
        agency_id,
        agencies (name, country, department, city)
      )
    `)
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
    `Hi, I'm interested in: ${listing.title} in ${listing.city}. Price: ${priceText}.`
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
          <Link className="text-sm underline" href="/en">
            {en.back}
          </Link>
          <LanguageSwitch current="en" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <FavoriteButton listingId={listing.id} initialCount={listing.favorites_count ?? 0} />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {priceText} • {listing.city} • {propertyType} • {listingType}
          {typeof listing.beds === "number" ? ` • ${en.bedsShort(listing.beds)}` : ""}
          {typeof listing.baths === "number" ? ` • ${en.bathsShort(listing.baths)}` : ""}
          {typeof listing.area_m2 === "number" ? ` • ${en.areaShort(listing.area_m2)}` : ""}
        </p>

        {/* Listing ownership */}
        {(listing as any).profiles?.[0] && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {(listing as any).profiles[0].role === 'realtor' ? (
              <>
                <span className="font-medium">{(listing as any).profiles[0].full_name}</span>
                {(listing as any).profiles[0].agencies?.[0] && (
                  <>,&nbsp;{(listing as any).profiles[0].agencies[0].name}</>
                )}
              </>
            ) : (
              <>{en.listedByOwner || 'Listed by owner'}</>
            )}
          </p>
        )}

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