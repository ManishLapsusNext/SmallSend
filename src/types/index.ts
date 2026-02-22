export interface SlidePage {
  image_url: string;
  page_number: number;
}

export interface Deck {
  id: string;
  title: string;
  slug: string;
  file_url: string;
  status: 'PENDING' | 'PROCESSED';
  user_id: string;
  display_order: number;
  pages: SlidePage[];
  created_at: string;
  description?: string;
  file_size?: number;
  require_email?: boolean;
  require_password?: boolean;
  view_password?: string;
  expires_at?: string | null;
}

export interface BrandingSettings {
  id: string;
  user_id: string;
  room_name?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  updated_at?: string | null;
}

export interface DeckStats {
  page_number: number;
  total_views: number;
  total_time_seconds: number;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  tier: 'FREE' | 'PRO' | 'PRO_PLUS';
  updated_at: string | null;
}
