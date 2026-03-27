/**
 * Profile shape for Uplat agents directory.
 */
export type Profile = {
  id: string;
  role: 'agency' | 'realtor' | 'user';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  department: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
  agency_id?: string | null;
  likes_count?: number;
  listing_count?: number;
  review_count?: number;
  average_rating?: number;
};