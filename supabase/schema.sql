-- DECKLY DATABASE SCHEMA
-- Copy and paste this into your Supabase SQL Editor

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
    viewed_at TIMESTAMPTZ DEFAULT NOW()
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

CREATE POLICY "Anyone can upsert stats" ON public.deck_stats
    FOR ALL USING (true) WITH CHECK (true); 
-- NOTE: In a high-security production app, upserts should be handled via Edge Functions.

CREATE POLICY "Owners can view their stats" ON public.deck_stats
    FOR SELECT USING (auth.uid() = user_id);

-- STORAGE BUCKETS
-- You must manually create a public bucket named 'decks' in the Supabase Dashboard.
-- Then apply these policies in the Storage tab:

/*
  1. ALL: Authenticated users can upload to their own folder (e.g., userId/...)
  2. SELECT: Anyone can read from the bucket (since it's public)
*/
