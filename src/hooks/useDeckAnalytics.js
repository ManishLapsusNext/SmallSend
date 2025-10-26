import { useState, useEffect, useRef } from 'react';
import { analyticsService } from '../services/analyticsService';

export function useDeckAnalytics(deck, pageNumber, numPages) {
  const [viewedPages, setViewedPages] = useState(new Set());
  const pageStartTime = useRef(Date.now());

  // Effect to track the initial deck view
  useEffect(() => {
    if (deck) {
      analyticsService.trackDeckView(deck);
    }
  }, [deck]);

  // Memoized function to track time spent on the current page
  const trackCurrentPage = () => {
    if (!pageNumber) return;
    const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
    analyticsService.trackPageView(deck, pageNumber, timeSpent);
    setViewedPages(prev => new Set(prev).add(pageNumber));
  };

  // Effect to track page changes and reset the timer
  useEffect(() => {
    pageStartTime.current = Date.now();
    
    // Cleanup function to track the page view when the page changes or component unmounts
    return () => {
      trackCurrentPage();
    };
  }, [pageNumber, deck]);

  // Effect to check if the entire deck has been viewed
  useEffect(() => {
    if (numPages && viewedPages.size === numPages) {
      analyticsService.trackDeckComplete(deck, numPages);
    }
  }, [viewedPages, numPages, deck]);

  return { trackCurrentPage };
}