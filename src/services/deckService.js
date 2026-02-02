import { supabase } from "./supabase";

export const deckService = {
  // Get all decks for the logged-in user
  async getAllDecks() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return []; // Fallback for safety

    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("user_id", session.user.id) // MANDATORY: Filter by owner
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get single deck by slug
  async getDeckBySlug(slug) {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  },

  // Get single deck by ID (management use)
  async getDeckById(id) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id) // MANDATORY check
      .single();

    if (error) throw error;
    return data;
  },

  // NEW: Upload a deck PDF
  async uploadDeck(file, deckData) {
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
    return deckRecord;
  },

  // Delete deck
  async deleteDeck(id, fileUrl, slug) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const userId = session.user.id;

    // 1. Delete the PDF file
    // Extract storage path from the public URL
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
  async uploadSlideImages(userId, deckSlug, imageBlobs) {
    const imageUrls = [];

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
  async updateDeckPages(deckId, pages) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("decks")
      .update({ pages, status: "PROCESSED" })
      .eq("id", deckId)
      .eq("user_id", session.user.id) // MANDATORY check
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get global branding settings (for the current user)
  async getBrandingSettings() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from("branding")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error; // Ignore "no rows found" error
    return data;
  },

  // Update global branding settings
  async updateBrandingSettings(settings) {
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
      return data;
    } else {
      const { data, error } = await supabase
        .from("branding")
        .insert([{ ...settings, user_id: session.user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Helper for user-specific storage path
  async getStoragePath(slug, filename) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    return `${session.user.id}/${slug}/${filename}`;
  },
};
