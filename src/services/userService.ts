import { supabase } from './supabase';
import { UserProfile } from '../types';
import { withRetry } from '../utils/resilience';

export const userService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error(`[User Service] Error fetching profile:`, error);
        return null;
      }

      return data;
    });
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  }
};
