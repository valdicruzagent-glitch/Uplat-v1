import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import SiteHeader from "@/app/components/SiteHeader";
import Link from "next/link";
import TrackListingView from "@/app/components/TrackListingView";
import { es } from "@/app/i18n/es";
import ImageGallery from "@/app/components/ImageGallery";
import FavoriteButton from "@/app/components/FavoriteButton";
import InquiryForm from "@/app/components/InquiryForm";
import ListingMap from "@/app/components/ListingMap";
import ReportButton from "@/app/components/ReportButton";
import OwnerCard from "@/app/components/OwnerCard";

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

export default async function ListingPage({
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

  // Obtener usuario actual (para rating)
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (error || !listing) {
    return (
      <>
        <SiteHeader locale="es" />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-10">
          <Link className="text-sm underline" href="/">
            {es.back}
          </Link>
          <h1 className="text-xl font-semibold">{es.listingNotFound}</h1>
        </main>
      </>
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
  const msg = encodeURIComponent(`Hola, estoy interesado en: ${listing.title} en ${listing.city}. Precio: ${priceText}.`);
  const wa = `https://wa.me/${contactWhatsapp.replace(/\D/g, "")}?text=${msg}`;

  return (
    <>
      <SiteHeader locale="es" />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-10">
        {hasMultiple ? (
          <ImageGallery images={sortedImages} initialIndex={initialIndex} />
        ) : fallbackPrimaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fallbackPrimaryImage} alt={String(title)} className="h-64 w-full rounded-xl object-cover" />
        ) : null}
        <Link className="text-sm underline" href="/">
          {es.back}
        </Link>
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

        {/* Owner card */}
        {(listing as any).profiles?.[0] && (
          <OwnerCard
            owner={{
              id: (listing as any).profiles[0].id,
              full_name: (listing as any).profiles[0].full_name,
              role: (listing as any).profiles[0].role,
              avatar_url: (listing as any).profiles[0].avatar_url,
              whatsapp_number: (listing as any).profiles[0].whatsapp_number,
              agency: (listing as any).profiles[0].agencies?.[0] || null,
            }}
            listingTitle={title}
            listingCity={listing.city}
            priceText={priceText}
            listingWhatsapp={listing.contact_whatsapp}
            currentUserId={currentUserId || undefined}
          />
        )}

        <TrackListingView listingId={listing.id} locale="es" />

        {listing.description ? <p className="text-sm leading-6">{listing.description}</p> : null}

        {typeof listing.lat === 'number' && typeof listing.lng === 'number' && (
          <div className="mt-6">
            <ListingMap lat={listing.lat} lng={listing.lng} title={title} price={priceText} />
          </div>
        )}

        {listing.status !== "archived" && (
          <>
            <InquiryForm
              listingId={listing.id}
              agentId={(listing as any).profiles?.[0]?.id || null}
              locale="es"
              translations={{
                askAbout: "Preguntar por esta propiedad",
                messagePlaceholder: "Tu mensaje...",
                waPlaceholder: "Tu WhatsApp (opcional)",
                submit: "Enviar consulta",
                submitting: "Enviando...",
                success: "¡Consulta enviada!",
                error: "Error al enviar. Intenta de nuevo.",
                signInToInquire: "Inicia sesión para preguntar por esta propiedad",
                signInButton: "Iniciar sesión",
              }}
            />
            <a
              className="mt-2 inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              {es.contactWhatsapp}
            </a>
          </>
        )}
      </main>
    </>
  );
}
