-- DECKLY DATABASE SCHEMA
-- Copy and paste this into your Supabase SQL Editor

-- 0. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'FREE', -- FREE, PRO, PRO_PLUS
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PROFILES
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 1. DECKS TABLE
CREATE TABLE IF NOT EXISTS public.decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    file_url TEXT,
    pages TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSED, ERROR
    file_size BIGINT,
    display_order INTEGER DEFAULT 1,
    require_email BOOLEAN DEFAULT FALSE,
    require_password BOOLEAN DEFAULT FALSE,
    view_password TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BRANDING TABLE
CREATE TABLE IF NOT EXISTS public.branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    room_name TEXT DEFAULT 'Deckly Data Room',
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ANALYTICS TABLES
CREATE TABLE IF NOT EXISTS public.deck_page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    visitor_id TEXT NOT NULL,
    viewer_email TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.deck_stats (
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    user_id UUID NOT NULL, -- Owner of the deck (redundant but helpful for RLS)
    total_views INTEGER DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (deck_id, page_number)
);

-- Optimized index for dashboard retrieval (filtering by deck, owner, and date)
CREATE INDEX IF NOT EXISTS idx_deck_stats_dashboard ON public.deck_stats(deck_id, user_id, updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_stats ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR DECKS
CREATE POLICY "Users can manage their own decks" ON public.decks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Decks are viewable by everyone" ON public.decks
    FOR SELECT USING (true);

-- POLICIES FOR BRANDING
CREATE POLICY "Users can manage their own branding" ON public.branding
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Branding is viewable by everyone" ON public.branding
    FOR SELECT USING (true);

-- POLICIES FOR ANALYTICS (Public insertion, Owner viewing)
CREATE POLICY "Anyone can record page views" ON public.deck_page_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can view their page views" ON public.deck_page_views
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.decks d WHERE d.id = deck_id AND d.user_id = auth.uid()
    ));

CREATE POLICY "Anyone can update their own page views" ON public.deck_page_views
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can upsert stats" ON public.deck_stats
    FOR ALL USING (true) WITH CHECK (true); 
-- NOTE: In a high-security production app, upserts should be handled via Edge Functions.

CREATE POLICY "Owners can view their stats" ON public.deck_stats
    FOR SELECT USING (auth.uid() = user_id);

-- 5. DATA ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.data_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    require_email BOOLEAN DEFAULT FALSE,
    require_password BOOLEAN DEFAULT FALSE,
    view_password TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DATA ROOM DOCUMENTS (junction table)
CREATE TABLE IF NOT EXISTS public.data_room_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_room_id UUID NOT NULL REFERENCES public.data_rooms(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(data_room_id, deck_id)
);

-- Indexes for data rooms
CREATE INDEX IF NOT EXISTS idx_data_rooms_user ON public.data_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_data_room_docs_room ON public.data_room_documents(data_room_id, display_order);

-- Enable RLS
ALTER TABLE public.data_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_room_documents ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR DATA ROOMS
CREATE POLICY "Users can manage their own data rooms" ON public.data_rooms
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Data rooms are viewable by everyone" ON public.data_rooms
    FOR SELECT USING (true);

-- POLICIES FOR DATA ROOM DOCUMENTS
CREATE POLICY "Owners can manage data room documents" ON public.data_room_documents
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.data_rooms dr WHERE dr.id = data_room_id AND dr.user_id = auth.uid()
    ));

CREATE POLICY "Data room documents are viewable by everyone" ON public.data_room_documents
    FOR SELECT USING (true);

-- STORAGE BUCKETS
-- You must manually create a public bucket named 'decks' in the Supabase Dashboard.
-- Then apply these policies in the Storage tab:

/*
  1. ALL: Authenticated users can upload to their own folder (e.g., userId/...)
  2. SELECT: Anyone can read from the bucket (since it's public)
*/

-- MIGRATIONS (for existing databases)
ALTER TABLE deck_page_views ADD COLUMN IF NOT EXISTS time_spent REAL DEFAULT 0;
ALTER TABLE deck_page_views ADD COLUMN IF NOT EXISTS viewer_email TEXT;

-- 7. SECURITY HARDENING: SECURE ACCESS GATE
-- This section implements server-side password validation to prevent leakage.

-- Public view for decks (excludes sensitive view_password)
CREATE OR REPLACE VIEW public.decks_public AS
SELECT 
    id, user_id, title, slug, description, file_url, pages, status, 
    file_size, display_order, require_email, require_password, expires_at, 
    created_at, updated_at
FROM public.decks;

-- Public view for data rooms (excludes sensitive view_password)
CREATE OR REPLACE VIEW public.data_rooms_public AS
SELECT 
    id, user_id, name, slug, description, icon_url, require_email, 
    require_password, expires_at, created_at, updated_at
FROM public.data_rooms;

-- Secure password validation function for Decks
CREATE OR REPLACE FUNCTION public.check_deck_password(p_slug TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- runs as owner
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.decks 
    WHERE slug = p_slug AND view_password = p_password
  );
END;
$$;

-- Secure password validation function for Data Rooms
CREATE OR REPLACE FUNCTION public.check_data_room_password(p_slug TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.data_rooms 
    WHERE slug = p_slug AND view_password = p_password
  );
END;
$$;

-- Note: In the Supabase dashboard, you should consider revoking SELECT on the 
-- original tables for anonymous users and only allowing SELECT on the views.
-- For now, the app will be updated to fetch from these views for public access.

