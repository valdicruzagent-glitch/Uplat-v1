import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import SiteHeader from "@/app/components/SiteHeader";
import Link from "next/link";
import TrackListingView from "@/app/components/TrackListingView";
import { en } from "@/app/i18n/en";
import ImageGallery from "@/app/components/ImageGallery";
import FavoriteButton from "@/app/components/FavoriteButton";
import InquiryForm from "@/app/components/InquiryForm";
import ListingMap from "@/app/components/ListingMap";
import OwnerCard from "@/app/components/OwnerCard";
import ReportButton from "@/app/components/ReportButton";
import ShareButton from "@/app/components/ShareButton";
import OwnerListingActions from "@/app/components/OwnerListingActions";
import { DEPARTMENTS_BY_COUNTRY } from "@/app/submit-listing/departments";
import { getAmenityDisplay } from "@/app/lib/amenities";

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

function getListingTypeLabel(listing: Record<string, unknown>) {
  const raw = typeof listing.listing_type === "string" ? listing.listing_type : listing.mode;
  if (raw === "buy" || raw === "sale") return "For sale";
  if (raw === "rent") return "For rent";
  return "For sale";
}

function getPropertyTypeLabel(listing: Record<string, unknown>) {
  const raw = typeof listing.property_type === "string" ? listing.property_type : listing.type;
  switch (raw) {
    case "house": return "House";
    case "apartment": return "Apartment";
    case "land": return "Land";
    case "farm": return "Farm";
    case "commercial": return "Commercial";
    case "office": return "Office";
    case "warehouse": return "Warehouse";
    default: return "House";
  }
}

function getDepartmentName(countryCode: unknown, departmentCode: unknown) {
  if (typeof countryCode !== 'string' || typeof departmentCode !== 'string') return '';
  const departments = DEPARTMENTS_BY_COUNTRY[countryCode] || [];
  return departments.find((item) => item.code === departmentCode)?.name || departmentCode;
}

export default async function ListingPageEn({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      *,
      profiles (
        id,
        full_name,
        role,
        agency_id,
        phone,
        whatsapp_number,
        avatar_url,
        agencies (name, country, department, city)
      )
    `)
    .eq("id", id)
    .single();

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (error || !listing) {
    return (
      <>
        <SiteHeader locale="en" />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-10">
          <Link className="text-sm underline" href="/en">
            {en.back}
          </Link>
          <h1 className="text-xl font-semibold">{en.listingNotFound}</h1>
        </main>
      </>
    );
  }

  const currentPriceValue = Number(listing.price_usd ?? 0);
  const originalPriceValue = Number(listing.price_original_usd ?? 0);
  const priceText = listing.price_usd ? `$${currentPriceValue.toLocaleString()}` : "—";
  const originalPriceText = listing.price_original_usd && originalPriceValue > currentPriceValue
    ? `$${originalPriceValue.toLocaleString()}`
    : null;
  const title = listing.headline || listing.title;
  const propertyType = getPropertyTypeLabel(listing);
  const listingType = getListingTypeLabel(listing);
  const sortedImages = getSortedImages(listing);
  const hasMultiple = sortedImages.length > 0;
  const primaryIdx = sortedImages.findIndex((img: any) => img.is_primary);
  const initialIndex = primaryIdx !== -1 ? primaryIdx : 0;
  const fallbackPrimaryImage = (() => {
    const imageUrls = Array.isArray(listing.image_urls) ? listing.image_urls : null;
    if (imageUrls?.length && typeof imageUrls[0] === "string") return imageUrls[0];
    return typeof listing.cover_image_url === "string" ? listing.cover_image_url : null;
  })();
  const ownerProfile = (listing as any).profiles?.[0] || null;
  const departmentName = getDepartmentName(listing.country_code, listing.department_code);
  const locationText = [listing.city, departmentName].filter(Boolean).join(', ');

  const isOwnerViewing = !!currentUserId && currentUserId === listing.profile_id;

  const { data: ownerInquiries } = isOwnerViewing
    ? await supabase
        .from('listing_inquiries')
        .select('id, message, created_at, status')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: null };

  const ownerCardProps = ownerProfile ? {
    owner: {
      id: ownerProfile.id,
      full_name: ownerProfile.full_name,
      role: ownerProfile.role,
      avatar_url: ownerProfile.avatar_url,
      whatsapp_number: ownerProfile.whatsapp_number,
      agency: ownerProfile.agencies?.[0] || null,
    },
    listingTitle: title,
    listingCity: listing.city,
    priceText,
    listingWhatsapp: listing.contact_whatsapp,
    currentUserId: currentUserId || undefined,
  } : null;

  return (
    <>
      <SiteHeader locale="en" />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <Link className="text-sm underline" href="/en">
          {en.back}
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="w-full space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{listingType}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{propertyType}</span>
              {locationText ? <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{locationText}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <ShareButton title={String(title)} priceText={priceText} locationText={locationText} />
            <FavoriteButton listingId={listing.id} initialCount={listing.favorites_count ?? 0} />
            <ReportButton listingId={listing.id} />
          </div>
        </div>

        {hasMultiple ? (
          <ImageGallery images={sortedImages} initialIndex={initialIndex} />
        ) : fallbackPrimaryImage ? (
          <img src={fallbackPrimaryImage} alt={String(title)} className="h-[30rem] w-full rounded-2xl object-cover md:h-[38rem]" />
        ) : null}

        <section className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-3xl font-bold tracking-tight md:text-4xl">{priceText}</p>
            {originalPriceText ? <p className="text-lg text-zinc-500 line-through dark:text-zinc-400">{originalPriceText}</p> : null}
            {originalPriceText ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Price reduced</span> : null}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-base text-zinc-800 dark:text-zinc-200">
            {typeof listing.beds === "number" ? <span>{en.bedsShort(listing.beds)}</span> : null}
            {typeof listing.baths === "number" ? <span>{en.bathsShort(listing.baths)}</span> : null}
            {typeof listing.area_m2 === "number" ? <span>{en.areaShort(listing.area_m2)}</span> : null}
          </div>
        </section>

        {ownerCardProps && <OwnerCard {...ownerCardProps} />}

        {isOwnerViewing && <OwnerListingActions listingId={listing.id} />}

        <TrackListingView listingId={listing.id} locale="en" />

        {listing.description ? (
          <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Description:</h2>
            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">{listing.description}</p>
            {Array.isArray(listing.amenities) && listing.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {listing.amenities
                  .filter((item: string) => !(listing.mode === 'buy' && item === 'pet_friendly'))
                  .map((item: string) => {
                    const amenity = getAmenityDisplay(item, 'en');
                    return (
                      <span key={item} className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        <span aria-hidden="true">{amenity.emoji}</span>
                        <span>{amenity.label}</span>
                      </span>
                    );
                  })}
              </div>
            ) : null}
          </section>
        ) : null}

        {typeof listing.lat === 'number' && typeof listing.lng === 'number' && (
          <div className="mt-2">
            <ListingMap lat={listing.lat} lng={listing.lng} title={title} price={priceText} />
          </div>
        )}

        {listing.status !== "archived" && (
          <>
            <InquiryForm
              listingId={listing.id}
              agentId={ownerProfile?.id || null}
              locale="en"
              translations={{
                askAbout: "Ask about this property",
                messagePlaceholder: "Ask about this property.",
                waPlaceholder: "",
                submit: "Send inquiry",
                submitting: "Sending...",
                success: "Inquiry sent!",
                error: "Failed to send. Try again.",
                signInToInquire: "Sign in to ask about this property",
                signInButton: "Sign in",
              }}
            />
            {ownerCardProps && <OwnerCard {...ownerCardProps} />}
          </>
        )}

        {isOwnerViewing ? (
          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Listing inquiries</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Only you can see this thread.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {ownerInquiries?.length || 0}
              </span>
            </div>

            {ownerInquiries && ownerInquiries.length > 0 ? (
              <div className="space-y-3">
                {ownerInquiries.map((inquiry) => (
                  <article key={inquiry.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          Q
                        </span>
                        <span>Inquiry</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="rounded-full bg-white px-2 py-1 capitalize dark:bg-zinc-900">{inquiry.status}</span>
                        <span>{new Date(inquiry.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">{inquiry.message}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                No inquiries yet for this listing.
              </div>
            )}
          </section>
        ) : null}
      </main>
    </>
  );
}
