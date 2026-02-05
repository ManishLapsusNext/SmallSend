import { supabase } from "./supabase";
import { Deck, BrandingSettings, SlidePage } from "../types";

export const deckService = {
  // Get all decks for the logged-in user
  async getAllDecks(): Promise<Deck[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return []; 

    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data as Deck[];
  },

  // Get single deck by slug
  async getDeckBySlug(slug: string): Promise<Deck> {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data as Deck;
  },

  // Get single deck by ID (management use)
  async getDeckById(id: string): Promise<Deck> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id) 
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
  async deleteDeck(id: string, fileUrl: string, slug: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const userId = session.user.id;

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
  async uploadSlideImages(userId: string, deckSlug: string, imageBlobs: Blob[]): Promise<string[]> {
    const imageUrls: string[] = [];

    const timestamp = Date.now();
    for (let i = 0; i < imageBlobs.length; i++) {
      const fileName = `${userId}/deck-images/${deckSlug}/page-${i + 1}-${timestamp}.webp`;

      const { error } = await supabase.storage
        .from("decks")
        .upload(fileName, imageBlobs[i], {
          contentType: "image/webp",
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("decks").getPublicUrl(fileName);

      imageUrls.push(publicUrl);
    }

    return imageUrls;
  },

  // NEW: Update deck with processed pages (with ownership check)
  async updateDeckPages(deckId: string, pages: SlidePage[]): Promise<Deck> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("decks")
      .update({ pages, status: "PROCESSED" })
      .eq("id", deckId)
      .eq("user_id", session.user.id) 
      .select()
      .single();

    if (error) throw error;
    return data as Deck;
  },

  // Update deck generic
  async updateDeck(deckId: string, updates: Partial<Deck>): Promise<Deck> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("decks")
      .update(updates)
      .eq("id", deckId)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Deck;
  },

  // Get global branding settings (for the current user)
  async getBrandingSettings(): Promise<BrandingSettings | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from("branding")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error; 
    return data as BrandingSettings;
  },

  // Update global branding settings
  async updateBrandingSettings(settings: Partial<BrandingSettings>): Promise<BrandingSettings> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    // Get existing record if any
    const { data: existing } = await supabase
      .from("branding")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

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
        .insert([{ ...settings, user_id: session.user.id }])
        .select()
        .single();
      if (error) throw error;
      return data as BrandingSettings;
    }
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
