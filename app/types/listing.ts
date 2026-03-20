export type Listing = {
  id: string;
  title: string;
  price_usd: number | null;
  type: "house" | "land" | "apartment" | string;
  mode: "buy" | "rent" | string;
  city: "Managua" | "San Juan del Sur" | "Granada" | string;
  country?: string | null;
  status?: "active" | "comp" | string | null;
  beds?: number | null;
  baths?: number | null;
  area_m2?: number | null;
  lat: number;
  lng: number;
  cover_image_url?: string | null;
  description?: string | null;
  created_at?: string;
};
