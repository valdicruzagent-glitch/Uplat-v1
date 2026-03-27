/**
 * Canonical listing shape used by the Uplat frontend.
 *
 * Why this file exists:
 * - Gives the app one readable contract for listing data.
 * - Supports both the legacy schema and the new V1 schema during migration.
 *
 * Safe edit note:
 * - If the database schema changes, update this file first.
 * - Keep temporary legacy fields until the frontend and database are fully reconciled.
 */
export type Listing = {
  id: string;
  title: string;
  slug?: string | null;
  headline?: string | null;
  price_usd: number | null;

  // Canonical V1 fields
  listing_type?: "sale" | "rent" | string | null;
  property_type?: "house" | "land" | "apartment" | string | null;
  image_urls?: string[] | null;
  address_text?: string | null;
  contact_name?: string | null;
  contact_whatsapp?: string | null;
  published_at?: string | null;
  updated_at?: string | null;

  // Legacy fields kept temporarily for safe migration
  type?: "house" | "land" | "apartment" | string | null;
  mode?: "buy" | "rent" | string | null;
  cover_image_url?: string | null;

  city: string;
  country?: string | null;
  department?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  status?: "draft" | "published" | "inactive" | "archived" | "active" | "comp" | string | null;
  beds?: number | null;
  baths?: number | null;
  area_m2?: number | null;
  area_ha?: number | null;
  lat: number;
  lng: number;
  description?: string | null;
  created_at?: string;
  meta?: Record<string, unknown> | null;

  // Normalized images
  listing_images?: Array<{
    id: string;
    listing_id: string;
    image_url: string;
    sort_order: number;
    is_primary: boolean;
    created_at: string;
  }> | null;

  // V1 extensions
  favorites_count?: number;
  is_sponsored?: boolean;
  sponsor_rank?: number;
  sponsored_until?: string;

  // Agent ownership
  profile_id?: string | null;
  profiles?: {
    id: string;
    full_name: string | null;
    role: string | null;
    agency_id: string | null;
    agencies?: { name: string }[] | null;
  } | null;

  // Features
  has_pool?: boolean;
  is_waterfront?: boolean;
};
