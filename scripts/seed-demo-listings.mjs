#!/usr/bin/env node
/**
 * Seed 100 demo listings into Supabase.
 * - 70 active, 30 comp
 * - Across Central America
 * - Idempotent: wipes rows where meta.demo = true, then inserts
 *
 * Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env.local)."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CITIES = [
  // Nicaragua
  { country: "Nicaragua", city: "Managua", lat: 12.1364, lng: -86.2514 },
  { country: "Nicaragua", city: "Granada", lat: 11.9299, lng: -85.956 },
  { country: "Nicaragua", city: "San Juan del Sur", lat: 11.252, lng: -85.87 },
  { country: "Nicaragua", city: "León", lat: 12.4379, lng: -86.878 },
  // Costa Rica
  { country: "Costa Rica", city: "San José", lat: 9.9281, lng: -84.0907 },
  { country: "Costa Rica", city: "Tamarindo", lat: 10.2993, lng: -85.841 },
  { country: "Costa Rica", city: "La Fortuna", lat: 10.4709, lng: -84.6453 },
  // Panama
  { country: "Panama", city: "Panama City", lat: 8.9824, lng: -79.5199 },
  { country: "Panama", city: "Boquete", lat: 8.7818, lng: -82.4413 },
  { country: "Panama", city: "Bocas del Toro", lat: 9.3406, lng: -82.241 },
  // Honduras
  { country: "Honduras", city: "Tegucigalpa", lat: 14.0723, lng: -87.1921 },
  { country: "Honduras", city: "San Pedro Sula", lat: 15.5, lng: -88.0333 },
  { country: "Honduras", city: "Roatán", lat: 16.328, lng: -86.523 },
  // Guatemala
  { country: "Guatemala", city: "Guatemala City", lat: 14.6349, lng: -90.5069 },
  { country: "Guatemala", city: "Antigua Guatemala", lat: 14.5586, lng: -90.7333 },
  { country: "Guatemala", city: "Lake Atitlán", lat: 14.6907, lng: -91.201 },
  // El Salvador
  { country: "El Salvador", city: "San Salvador", lat: 13.6929, lng: -89.2182 },
  { country: "El Salvador", city: "Santa Ana", lat: 13.9942, lng: -89.5597 },
  { country: "El Salvador", city: "El Tunco", lat: 13.4948, lng: -89.3838 },
  // Belize
  { country: "Belize", city: "Belize City", lat: 17.5046, lng: -88.1962 },
  { country: "Belize", city: "San Pedro", lat: 17.915, lng: -87.965 },
  { country: "Belize", city: "Placencia", lat: 16.5149, lng: -88.3667 },
];

const MODES = ["buy", "rent"]; // app filters use these
const TYPES = ["house", "apartment", "land"];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function roundTo(n, step) {
  return Math.round(n / step) * step;
}

function priceFor({ country, type, mode, status }) {
  // Totally synthetic ranges (not scraped/derived from any competitor data)
  const base = {
    Nicaragua: 70000,
    "Costa Rica": 180000,
    Panama: 220000,
    Honduras: 90000,
    Guatemala: 140000,
    "El Salvador": 120000,
    Belize: 200000,
  }[country] ?? 120000;

  let mult = 1;
  if (type === "land") mult = 0.9;
  if (type === "apartment") mult = 1.1;
  if (mode === "rent") mult *= 0.015; // monthly-ish, simplified
  if (status === "comp") mult *= 0.95;

  const noise = 0.65 + Math.random() * 1.1; // 0.65–1.75
  const p = base * mult * noise;

  if (mode === "rent") return roundTo(Math.max(350, Math.min(p, 6500)), 25);
  return roundTo(Math.max(35000, Math.min(p, 1200000)), 1000);
}

function areaFor(type) {
  if (type === "land") {
    // hectares
    const ha = (Math.random() < 0.7 ? Math.random() * 1.5 : Math.random() * 8) + 0.15;
    return { area_m2: null, area_ha: Number(ha.toFixed(2)) };
  }

  // m2
  const m2 = type === "apartment" ? randInt(45, 160) : randInt(70, 380);
  return { area_m2: m2, area_ha: null };
}

function bedsBathsFor(type) {
  if (type === "land") return { beds: null, baths: null };
  if (type === "apartment") return { beds: randInt(1, 3), baths: randInt(1, 2) };
  return { beds: randInt(2, 5), baths: randInt(1, 4) };
}

function titleFor({ type, mode, city, country }) {
  const vibe =
    type === "land"
      ? pick(["Ocean-view lot", "Hillside parcel", "Garden lot", "Development land", "Ranch land"])
      : type === "apartment"
        ? pick(["Modern apartment", "City-view condo", "Quiet flat", "Renovated condo", "Bright apartment"])
        : pick(["Family home", "Coastal house", "Modern home", "Courtyard house", "Gated home"]);

  const tail = mode === "rent" ? "for rent" : "for sale";
  return `${vibe} ${tail} in ${city}, ${country}`;
}

function coverUrl(i, type) {
  const q =
    type === "land"
      ? "land,landscape,tropical"
      : type === "apartment"
        ? "apartment,interior,modern"
        : "house,home,architecture";
  // Unsplash Source endpoint: no API key required.
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}&sig=${i}`;
}

function descriptionFor({ type, mode, city, country }) {
  const lines = [];
  lines.push(`Synthetic demo listing for Uplat (${mode}).`);
  lines.push(`Located near ${city}, ${country}.`);
  if (type === "land") lines.push("Great for a small project or long-term hold. Boundaries and services to be verified.");
  else lines.push("Natural light, functional layout, and easy access to main roads. Details to be verified.");
  return lines.join(" ");
}

async function wipeDemoRows() {
  // Requires listings.meta jsonb column (see migration).
  const { error } = await supabase.from("listings").delete().contains("meta", { demo: true });
  if (error) {
    // If meta column doesn't exist or RLS blocks delete, this will fail.
    throw new Error(`Failed to wipe existing demo rows: ${error.message}`);
  }
}

function buildListings() {
  const out = [];
  const seedTag = `demo_seed_${new Date().toISOString().slice(0, 10)}`;

  for (let i = 0; i < 100; i++) {
    const status = i < 70 ? "active" : "comp";
    const loc = pick(CITIES);
    const type = pick(TYPES);
    const mode = pick(MODES);

    const { beds, baths } = bedsBathsFor(type);
    const { area_m2, area_ha } = areaFor(type);

    const row = {
      title: titleFor({ type, mode, city: loc.city, country: loc.country }),
      price_usd: priceFor({ country: loc.country, type, mode, status }),
      type,
      mode,
      city: loc.city,
      country: loc.country,
      status,
      category: type === "land" ? "land" : "residential",
      beds,
      baths,
      area_m2,
      area_ha,
      lat: loc.lat + (Math.random() - 0.5) * 0.08,
      lng: loc.lng + (Math.random() - 0.5) * 0.08,
      cover_image_url: coverUrl(i + 1, type),
      description: descriptionFor({ type, mode, city: loc.city, country: loc.country }),
      meta: { demo: true, seed: seedTag },
    };

    out.push(row);
  }
  return out;
}

async function insertBatched(rows, batchSize = 25) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("listings").insert(batch);
    if (error) throw new Error(`Insert failed at batch starting ${i}: ${error.message}`);
  }
}

async function main() {
  console.log("Seeding demo listings…");
  console.log("- wiping existing demo rows (meta.demo=true)");
  await wipeDemoRows();

  const rows = buildListings();
  console.log(`- inserting ${rows.length} rows`);
  await insertBatched(rows);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
