import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { analyticsService } from "../services/analyticsService";
import { Deck } from "../types";

interface ImageDeckViewerProps {
  deck: Deck;
}

function ImageDeckViewer({ deck }: ImageDeckViewerProps) {
  // Stabilize the pages array reference to avoid unnecessary effect re-runs
  const pages = useMemo(
    () => (Array.isArray(deck?.pages) ? deck.pages : []),
    [deck?.pages],
  );
  const numPages = pages.length;

  const [currentPage, setCurrentPage] = useState(1);
  const startTimeRef = useRef(Date.now());

  // Prefetching: Load the next two slides in the background
  useEffect(() => {
    const prefetchPages = [currentPage + 1, currentPage + 2];

    prefetchPages.forEach((pageIdx) => {
      if (pageIdx <= numPages) {
        const page = pages[pageIdx - 1];
        const imageUrl = page?.image_url;
        if (imageUrl) {
          const img = new Image();
          img.src = imageUrl;
        }
      }
    });
  }, [currentPage, pages, numPages]);

  // Track time spent on each page
  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const endTime = Date.now();
      const timeSpent = (endTime - startTimeRef.current) / 1000;

      if (timeSpent > 0.5) {
        analyticsService.trackPageView(deck, currentPage, timeSpent);
        analyticsService.syncSlideStats(deck, currentPage, timeSpent);

        if (currentPage === numPages) {
          analyticsService.trackDeckComplete(deck, numPages);
        }
      }
    };
  }, [currentPage, deck, numPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    if (numPages > 0) {
      setCurrentPage((prev) => Math.min(prev + 1, numPages));
    }
  }, [numPages]);

  useKeyboardControls(goToPrevPage, goToNextPage);

  if (numPages === 0) {
    return (
      <div className="viewer-error-state">
        <h2>No Pages Found</h2>
        <p>
          This deck could not be loaded because it has not been processed into
          images yet.
        </p>
      </div>
    );
  }

  const currentImage = pages[currentPage - 1]?.image_url;

  return (
    <div className="image-deck-viewer">
      <div className="slide-container" key={currentImage}>
        <img
          src={currentImage}
          alt={`Slide ${currentPage}`}
          className="slide-image"
        />

        <div className="navigation-overlay">
          <div
            className="nav-area prev"
            onClick={goToPrevPage}
            style={{ display: currentPage <= 1 ? "none" : "block" }}
          ></div>
          <div
            className="nav-area next"
            onClick={goToNextPage}
            style={{ display: currentPage >= numPages ? "none" : "block" }}
          ></div>
        </div>
      </div>

      <footer className="viewer-footer">
        <div className="page-info">
          {currentPage} / {numPages}
        </div>
      </footer>
    </div>
  );
}

export default ImageDeckViewer;
