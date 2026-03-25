import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) {
    envVars[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
  }
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const listings = [
  {
    title: "Apartamento amueblado cerca de Metrocentro",
    headline: "Apartamento amueblado cerca de Metrocentro",
    price_usd: 850,
    mode: "rent",
    property_type: "apartment",
    city: "Managua",
    lat: 12.1364,
    lng: -86.2514,
    beds: 2,
    baths: 1,
    area_m2: 85,
    image_urls: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],
    status: "active",
  },
  {
    title: "Casa amplia en residencial seguro",
    headline: "Casa amplia en residencial seguro",
    price_usd: 1500,
    mode: "rent",
    property_type: "house",
    city: "Managua",
    lat: 12.115,
    lng: -86.35,
    beds: 3,
    baths: 2,
    area_m2: 180,
    image_urls: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"],
    status: "active",
  },
  {
    title: "Terreno para proyecto pequeño",
    headline: "Terreno para proyecto pequeño",
    price_usd: 600,
    mode: "rent",
    property_type: "land",
    city: "Managua",
    lat: 12.12,
    lng: -86.3,
    area_m2: 500,
    image_urls: [],
    status: "active",
  },
  {
    title: "Finca productiva a las afueras",
    headline: "Finca productiva a las afueras",
    price_usd: 1200,
    mode: "rent",
    property_type: "farm",
    city: "Managua",
    lat: 12.2,
    lng: -86.4,
    area_m2: 2000,
    image_urls: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"],
    status: "active",
  },
  {
    title: "Estudio moderno céntrico",
    headline: "Estudio moderno céntrico",
    price_usd: 500,
    mode: "rent",
    property_type: "apartment",
    city: "Managua",
    lat: 12.14,
    lng: -86.24,
    beds: 1,
    baths: 1,
    area_m2: 45,
    image_urls: [],
    status: "active",
  },
  {
    title: "Apartamento 2Hab bien ubicado",
    headline: "Apartamento 2Hab bien ubicado",
    price_usd: 950,
    mode: "rent",
    property_type: "apartment",
    city: "Managua",
    lat: 12.13,
    lng: -86.26,
    beds: 2,
    baths: 2,
    area_m2: 100,
    image_urls: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"],
    status: "active",
  },
  {
    title: "Casa esquina amplio jardín",
    headline: "Casa esquina amplio jardín",
    price_usd: 1800,
    mode: "rent",
    property_type: "house",
    city: "Managua",
    lat: 12.11,
    lng: -86.34,
    beds: 4,
    baths: 3,
    area_m2: 240,
    image_urls: [],
    status: "active",
  },
  {
    title: "Terreno llano cerca de carretera",
    headline: "Terreno llano cerca de carretera",
    price_usd: 750,
    mode: "rent",
    property_type: "land",
    city: "Managua",
    lat: 12.18,
    lng: -86.38,
    area_m2: 800,
    image_urls: [],
    status: "active",
  },
];

async function seed() {
  const { error } = await supabase.from('listings').insert(listings);
  if (error) {
    console.error('Error seeding listings:', error);
    process.exit(1);
  }
  console.log(`Inserted ${listings.length} rental listings in Managua.`);
}

seed();
