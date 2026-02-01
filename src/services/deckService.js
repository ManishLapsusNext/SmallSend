import { supabase } from "./supabase";

export const deckService = {
  // Get all decks
  async getAllDecks() {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
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

  // Get single deck by ID
  async getDeckById(id) {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Upload PDF and create deck
  async uploadDeck(file, deckData) {
    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${deckData.slug}-${Date.now()}.${fileExt}`;

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
        },
      ])
      .select()
      .single();

    if (deckError) throw deckError;
    return deckRecord;
  },

  // Delete deck
  async deleteDeck(id, fileUrl, slug) {
    // 1. Delete the PDF file
    const fileName = fileUrl.split("/").pop();
    await supabase.storage.from("decks").remove([fileName]);

    // 2. Delete processed images if any
    const { data: files } = await supabase.storage
      .from("decks")
      .list(`deck-images/${slug}`);

    if (files && files.length > 0) {
      const filesToDelete = files.map((f) => `deck-images/${slug}/${f.name}`);
      await supabase.storage.from("decks").remove(filesToDelete);
    }

    // 3. Delete from database
    const { error } = await supabase.from("decks").delete().eq("id", id);
    if (error) throw error;
  },

  // NEW: Upload processing images
  async uploadSlideImages(deckSlug, imageBlobs) {
    const imageUrls = [];

    const timestamp = Date.now();
    for (let i = 0; i < imageBlobs.length; i++) {
      const fileName = `deck-images/${deckSlug}/page-${i + 1}-${timestamp}.png`;

      const { error } = await supabase.storage
        .from("decks")
        .upload(fileName, imageBlobs[i], {
          contentType: "image/png",
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

  // NEW: Update deck with processed pages
  async updateDeckPages(deckId, pages) {
    const { data, error } = await supabase
      .from("decks")
      .update({ pages, status: "PROCESSED" })
      .eq("id", deckId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
