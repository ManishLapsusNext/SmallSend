import { supabase } from "./supabase";
import { withRetry } from "../utils/resilience";

export const noteService = {
  async getNote(deckId: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return "";

    const { data, error } = await supabase
      .from("investor_notes")
      .select("content")
      .eq("user_id", session.user.id)
      .eq("deck_id", deckId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching note:", error);
      return "";
    }
    
    return data?.content || "";
  },

  async saveNote(deckId: string, content: string): Promise<void> {
    return withRetry(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("investor_notes")
        .upsert({
          user_id: session.user.id,
          deck_id: deckId,
          content: content,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id, deck_id" });

      if (error) throw error;
    });
  }
};
