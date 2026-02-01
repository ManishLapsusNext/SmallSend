import posthog from 'posthog-js'

// Initialize PostHog
const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    // Default feature flag rollout date
    defaults: '2025-05-24',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    capture_exceptions: true, // Enable error tracking
    debug: import.meta.env.MODE === 'development'
  })
} else {
  console.warn('PostHog key not found - analytics disabled')
}

export const analyticsService = {
  // Track when someone views a deck
  trackDeckView(deck) {
    if (!posthogKey) return
    
    posthog.capture('deck_viewed', {
      deck_id: deck.id,
      deck_slug: deck.slug,
      deck_title: deck.title
    })
  },

  // Track page navigation in PDF
  trackPageView(deck, pageNumber, timeSpent = 0) {
    if (!posthogKey) return
    
    posthog.capture('pdf_page_viewed', {
      deck_id: deck.id,
      deck_slug: deck.slug,
      deck_title: deck.title,
      page_number: pageNumber,
      time_spent_seconds: timeSpent
    })
  },

  // Track when someone completes viewing a deck
  trackDeckComplete(deck, totalPages) {
    if (!posthogKey) return
    
    posthog.capture('deck_completed', {
      deck_id: deck.id,
      deck_slug: deck.slug,
      deck_title: deck.title,
      total_pages: totalPages
    })
  },

  // Identify user (if you add auth later)
  identifyUser(userId, traits) {
    if (!posthogKey) return
    posthog.identify(userId, traits)
  }
}