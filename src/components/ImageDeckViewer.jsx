import { useState, useCallback, useEffect, useRef } from "react";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { analyticsService } from "../services/analyticsService";

function ImageDeckViewer({ deck }) {
  // --- FIX IS HERE ---
  // Add a defensive check. If deck.pages doesn't exist, default to an empty array.
  const pages = Array.isArray(deck?.pages) ? deck.pages : [];
  const numPages = pages.length;

  const [currentPage, setCurrentPage] = useState(1);
  const startTimeRef = useRef(Date.now());

  // Track time spent on each page
  useEffect(() => {
    // Start measuring time for the NEW current page
    startTimeRef.current = Date.now();

    // The cleanup function fires when the user leaves the current page
    // (either by changing the page number or by unmounting the component)
    return () => {
      const endTime = Date.now();
      const timeSpent = (endTime - startTimeRef.current) / 1000;

      // We only track if they spent more than 0.5 seconds (filter out accidental scrolls)
      if (timeSpent > 0.5) {
        analyticsService.trackPageView(deck, currentPage, timeSpent);
        analyticsService.syncSlideStats(deck, currentPage, timeSpent);

        // If it's the last page, also mark it as completed
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
    // Make sure we don't go past the end
    if (numPages > 0) {
      setCurrentPage((prev) => Math.min(prev + 1, numPages));
    }
  }, [numPages]);

  useKeyboardControls(goToPrevPage, goToNextPage);

  // Handle the case where there are no images to show
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

  const currentImage = pages[currentPage - 1];

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
