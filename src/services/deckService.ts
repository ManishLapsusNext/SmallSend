import { supabase } from "./supabase";
import { Deck, BrandingSettings, SlidePage } from "../types";
import { withRetry } from "../utils/resilience";
 
const brandingCache = new Map<string, { data: BrandingSettings | null; timestamp: number }>();

export const deckService = {
  // Get all decks for the logged-in user
  async getAllDecks(providedUserId?: string): Promise<Deck[]> {
    return withRetry(async () => {
      let userId = providedUserId;

      if (!userId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];
        userId = session.user.id;
      }

      const { data, error } = await supabase
        .from("decks")
        .select("*")
        .eq("user_id", userId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Deck[];
    });
  },

  // Get single deck by slug (uses public view to hide password)
  async getDeckBySlug(slug: string): Promise<Deck> {
    const { data, error } = await supabase
      .from("decks_public")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data as Deck;
  },

  // NEW: Securely check deck password via RPC
  async checkDeckPassword(slug: string, password: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("check_deck_password", {
      p_slug: slug,
      p_password: password,
    });
    if (error) throw error;
    return !!data;
  },

  // Get single deck by ID (management use)
  async getDeckById(id: string, providedUserId?: string): Promise<Deck> {
    let userId = providedUserId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      userId = session.user.id;
    }

    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId) 
      .single();

    if (error) throw error;
    return data as Deck;
  },

  // NEW: Upload a deck PDF
  async uploadDeck(file: File, deckData: Partial<Deck>): Promise<Deck> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const userId = session.user.id;

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/decks/${deckData.slug}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("decks")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("decks").getPublicUrl(fileName);

    // Create deck record
    const { data: deckRecord, error: deckError } = await supabase
      .from("decks")
      .insert([
        {
          ...deckData,
          file_url: publicUrl,
          status: "PENDING",
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (deckError) throw deckError;
    return deckRecord as Deck;
  },

  // Delete deck
  async deleteDeck(id: string, fileUrl: string, slug: string, providedUserId?: string): Promise<void> {
    let userId = providedUserId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      userId = session.user.id;
    }

    // 1. Delete the PDF file
    const urlParts = fileUrl.split("/storage/v1/object/public/decks/");
    const storagePath = urlParts[1];

    if (storagePath) {
      await supabase.storage.from("decks").remove([storagePath]);
    }

    // 2. Delete processed images
    const { data: files } = await supabase.storage
      .from("decks")
      .list(`${userId}/deck-images/${slug}`);

    if (files && files.length > 0) {
      const filesToDelete = files.map(
        (f) => `${userId}/deck-images/${slug}/${f.name}`,
      );
      await supabase.storage.from("decks").remove(filesToDelete);
    }

    // 3. Delete from database
    const { error } = await supabase
      .from("decks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  },

  // NEW: Upload processing images
  async uploadSlideImages(
    userId: string, 
    deckSlug: string, 
    imageBlobs: Blob[],
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const imageUrls: string[] = new Array(imageBlobs.length);
    const timestamp = Date.now();
    const CONCURRENCY_LIMIT = 3;

    // Helper for a single upload with retry
    const uploadSingle = async (index: number) => {
      const fileName = `${userId}/deck-images/${deckSlug}/page-${index + 1}-${timestamp}.webp`;
      
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const { error } = await supabase.storage
            .from("decks")
            .upload(fileName, imageBlobs[index], {
              contentType: "image/webp",
              upsert: true,
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage.from("decks").getPublicUrl(fileName);
          imageUrls[index] = publicUrl;
          
          if (onProgress) {
            const completedCount = imageUrls.filter(Boolean).length;
            onProgress(completedCount, imageBlobs.length);
          }
          return;
        } catch (err) {
          attempts++;
          if (attempts === maxAttempts) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Backoff
        }
      }
    };

    // Run in parallel with concurrency limit
    for (let i = 0; i < imageBlobs.length; i += CONCURRENCY_LIMIT) {
      const chunk = imageBlobs.slice(i, i + CONCURRENCY_LIMIT).map((_, idx) => uploadSingle(i + idx));
      await Promise.all(chunk);
    }

    return imageUrls;
  },

  // NEW: Update deck with processed pages (with ownership check)
  async updateDeckPages(deckId: string, pages: SlidePage[], providedUserId?: string): Promise<Deck> {
    let userId = providedUserId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      userId = session.user.id;
    }

    const { data, error } = await supabase
      .from("decks")
      .update({ pages, status: "PROCESSED" })
      .eq("id", deckId)
      .eq("user_id", userId) 
      .select()
      .single();

    if (error) throw error;
    return data as Deck;
  },

  // Update deck generic
  async updateDeck(deckId: string, updates: Partial<Deck>, providedUserId?: string): Promise<Deck> {
    let userId = providedUserId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      userId = session.user.id;
    }

    const { data, error } = await supabase
      .from("decks")
      .update(updates)
      .eq("id", deckId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as Deck;
  },

  // Get global branding settings (for the current user)
  async getBrandingSettings(providedUserId?: string): Promise<BrandingSettings | null> {
    const userIdPromise = (async () => {
      if (providedUserId) return providedUserId;
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    })();

    const userId = await userIdPromise;
    if (!userId) return null;

    const cacheKey = `branding-${userId}`;
    const cached = brandingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
      return cached.data;
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from("branding")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      const result = data as BrandingSettings;
      brandingCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    });
  },

  // Update global branding settings
  async updateBrandingSettings(settings: Partial<BrandingSettings>, providedUserId?: string): Promise<BrandingSettings> {
    let userId = providedUserId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      userId = session.user.id;
    }

    // Get existing record if any
    const { data: existing } = await supabase
      .from("branding")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("branding")
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as BrandingSettings;
    } else {
      const { data, error } = await supabase
        .from("branding")
        .insert([{ ...settings, user_id: userId }])
        .select()
        .single();
      if (error) throw error;
      
      // Clear cache on update
      brandingCache.delete(`branding-${userId}`);
      return data as BrandingSettings;
    }
  },

  // Get all decks with aggregated stats for Content management
  async getDecksWithAnalytics(providedUserId?: string): Promise<any[]> {
    return withRetry(async () => {
      let userId = providedUserId;
      if (!userId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];
        userId = session.user.id;
      }

      // 1. Fetch decks
      const { data: decks, error: decksError } = await supabase
        .from("decks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (decksError) throw decksError;
      if (!decks || decks.length === 0) return [];

      const deckIds = decks.map(d => d.id);

      // 2. Fetch latest activity from deck_stats
    const { data: stats, error: statsError } = await supabase
      .from("deck_stats")
      .select("deck_id, updated_at")
      .in("deck_id", deckIds);

    if (statsError) throw statsError;

    // 3. Fetch unique visitors per deck from deck_page_views
    const { data: pageViews } = await supabase
      .from("deck_page_views")
      .select("deck_id, visitor_id")
      .in("deck_id", deckIds);

    // Count unique visitors per deck
    const viewsMap: Record<string, Set<string>> = {};
    (pageViews || []).forEach((pv: any) => {
      if (!viewsMap[pv.deck_id]) viewsMap[pv.deck_id] = new Set();
      viewsMap[pv.deck_id].add(pv.visitor_id);
    });

    // Find latest activity per deck
    const lastActiveMap: Record<string, string | null> = {};
    (stats || []).forEach(s => {
      const id = s.deck_id;
      if (!lastActiveMap[id] || (s.updated_at && s.updated_at > lastActiveMap[id]!)) {
        lastActiveMap[id] = s.updated_at;
      }
    });

    // 4. Merge data
    return decks.map(deck => ({
      ...deck,
      total_views: viewsMap[deck.id]?.size || 0,
      last_viewed_at: lastActiveMap[deck.id] || null
    }));
  });
  },

  // Helper for user-specific storage path
  async getStoragePath(slug: string, filename: string): Promise<string> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    return `${session.user.id}/${slug}/${filename}`;
  },
};
