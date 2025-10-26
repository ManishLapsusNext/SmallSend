import { supabase } from './supabase'

export const deckService = {
  // Get all decks
  async getAllDecks() {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get single deck by slug
  async getDeckBySlug(slug) {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) throw error
    return data
  },

  // Upload PDF and create deck
  async uploadDeck(file, deckData) {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${deckData.slug}-${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('decks')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('decks')
      .getPublicUrl(fileName)

    // Create deck record
    const { data: deckRecord, error: deckError } = await supabase
      .from('decks')
      .insert([
        {
          ...deckData,
          file_url: publicUrl
        }
      ])
      .select()
      .single()
    
    if (deckError) throw deckError
    return deckRecord
  },

  // Delete deck
  async deleteDeck(id, fileUrl) {
    // Extract filename from URL
    const fileName = fileUrl.split('/').pop()
    
    // Delete from storage
    await supabase.storage
      .from('decks')
      .remove([fileName])

    // Delete from database
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}