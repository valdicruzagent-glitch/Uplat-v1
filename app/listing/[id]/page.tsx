import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default async function ListingPage({
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
          <Link className="text-sm underline" href="/">
            ← Back
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Listing not found</h1>
        </div>
      </main>
    );
  }

  const msg = encodeURIComponent(
    `Hola, estoy interesado en: ${listing.title} en ${listing.city}. Precio: $${listing.price_usd}.`
  );
  const wa = `https://wa.me/505XXXXXXXX?text=${msg}`;

  return (
    <main className="min-h-dvh bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        <Link className="text-sm underline" href="/">
          ← Back
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ${Number(listing.price_usd).toLocaleString()} • {listing.city} • {listing.type} • {listing.mode}
        </p>

        {listing.description ? (
          <p className="text-sm leading-6">{listing.description}</p>
        ) : null}

        <a
          className="mt-2 inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          href={wa}
          target="_blank"
          rel="noreferrer"
        >
          Contact on WhatsApp
        </a>
      </div>
    </main>
  );
}
