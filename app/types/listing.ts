export type Listing = {
  id: string;
  title: string;
  price_usd: number;
  type: "house" | "land" | "apartment" | string;
  mode: "buy" | "rent" | string;
  city: "Managua" | "San Juan del Sur" | "Granada" | string;
  lat: number;
  lng: number;
  cover_image_url?: string | null;
  description?: string | null;
  created_at?: string;
};
