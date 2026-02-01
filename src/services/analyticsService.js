import posthog from "posthog-js";
import { supabase } from "./supabase";

// Initialize PostHog
const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost =
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    // Default feature flag rollout date
    defaults: "2025-05-24",
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    capture_exceptions: true, // Enable error tracking
    debug: import.meta.env.MODE === "development",
  });
} else {
  console.warn("PostHog key not found - analytics disabled");
}

export const analyticsService = {
  // Track when someone views a deck
  trackDeckView(deck) {
    if (!posthogKey) return;

    posthog.capture("deck_viewed", {
      deck_id: deck.id,
      deck_slug: deck.slug,
      deck_title: deck.title,
      owner_id: deck.user_id, // The ID of the user who owns the deck
    });
  },

  // Track page navigation in PDF
  trackPageView(deck, pageNumber, timeSpent = 0) {
    if (!posthogKey) return;

    posthog.capture("pdf_page_viewed", {
      deck_id: deck.id,
      deck_slug: deck.slug,
      deck_title: deck.title,
      owner_id: deck.user_id,
      page_number: pageNumber,
      time_spent_seconds: Math.round(timeSpent),
    });
  },

  // Track when someone completes viewing a deck
  trackDeckComplete(deck, totalPages) {
    if (!posthogKey) return;

    posthog.capture("deck_completed", {
      deck_id: deck.id,
      deck_slug: deck.slug,
      deck_title: deck.title,
      owner_id: deck.user_id,
      total_pages: totalPages,
    });
  },

  // Identify user (if you add auth later)
  identifyUser(userId, traits) {
    if (!posthogKey) return;
    posthog.identify(userId, traits);
  },

  // NEW: Get or generate a persistent visitor ID
  getVisitorId() {
    let visitorId = localStorage.getItem("deckly_visitor_id");
    if (!visitorId) {
      // Use crypto.randomUUID() for modern browsers, or a simple polyfill
      visitorId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "v-" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("deckly_visitor_id", visitorId);
    }
    return visitorId;
  },

  // NEW: Sync stats to Supabase for user dashboard (Refined for uniqueness)
  async syncSlideStats(deck, pageNumber, timeSpent) {
    try {
      const visitorId = this.getVisitorId();
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      // 1. Check if this visitor has seen this slide in the last 24 hours
      const { data: recentView, error: viewError } = await supabase
        .from("deck_page_views")
        .select("id")
        .eq("deck_id", deck.id)
        .eq("page_number", pageNumber)
        .eq("visitor_id", visitorId)
        .gt("viewed_at", twentyFourHoursAgo)
        .limit(1)
        .maybeSingle();

      if (viewError) throw viewError;

      const isUniqueView = !recentView;

      // 2. If it's a unique view, record it in the registry
      if (isUniqueView) {
        await supabase.from("deck_page_views").insert({
          deck_id: deck.id,
          page_number: pageNumber,
          visitor_id: visitorId,
          viewed_at: new Date().toISOString(),
        });
      }

      // 3. Update the aggregate stats
      // We always add time, but only add a view if it's unique today
      const { data: existing, error: fetchError } = await supabase
        .from("deck_stats")
        .select("total_views, total_time_seconds")
        .eq("deck_id", deck.id)
        .eq("page_number", pageNumber)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      const newViews = (existing?.total_views || 0) + (isUniqueView ? 1 : 0);
      const newTime = (existing?.total_time_seconds || 0) + timeSpent;

      // 4. Upsert the new values
      const { error: upsertError } = await supabase.from("deck_stats").upsert(
        {
          deck_id: deck.id,
          page_number: pageNumber,
          total_views: newViews,
          total_time_seconds: newTime,
          user_id: deck.user_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "deck_id, page_number" },
      );

      if (upsertError) throw upsertError;
    } catch (err) {
      console.error("Error syncing slide stats:", err);
    }
  },

  // Get stats for a specific deck
  async getDeckStats(deckId) {
    const { data, error } = await supabase
      .from("deck_stats")
      .select("*")
      .eq("deck_id", deckId)
      .order("page_number", { ascending: true });

    if (error) throw error;
    return data;
  },
};
