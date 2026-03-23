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
};
