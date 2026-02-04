import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useDeckAnalytics } from "../hooks/useDeckAnalytics";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { Deck } from "../types";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DeckViewerProps {
  deck: Deck;
}

function DeckViewer({ deck }: DeckViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Custom hooks for handling logic
  const { trackCurrentPage } = useDeckAnalytics(
    deck,
    pageNumber,
    numPages || 0,
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    [],
  );

  const goToPrevPage = useCallback(() => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    if (numPages) {
      setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages));
    }
  }, [numPages]);

  // Set up keyboard controls with stable callbacks
  useKeyboardControls(goToPrevPage, goToNextPage);

  const handleNavigationClick = (direction: "prev" | "next") => {
    // Manually track page before navigating
    trackCurrentPage();
    if (direction === "next") {
      goToNextPage();
    } else {
      goToPrevPage();
    }
  };

  return (
    <div className="deck-viewer">
      <div className="slide-container">
        <Document
          file={deck.file_url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="pdf-loading">Loading PDF...</div>}
          error={<div className="pdf-error">Failed to load PDF.</div>}
        >
          <Page
            key={`page_${pageNumber}`}
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            scale={2.0}
            loading=""
            className="slide-image"
          />
        </Document>

        <div className="navigation-overlay">
          <div
            className="nav-area prev"
            onClick={() => handleNavigationClick("prev")}
            style={{ display: pageNumber <= 1 ? "none" : "block" }}
          ></div>
          <div
            className="nav-area next"
            onClick={() => handleNavigationClick("next")}
            style={{
              display: numPages && pageNumber >= numPages ? "none" : "block",
            }}
          ></div>
        </div>
      </div>

      <footer className="viewer-footer">
        <div className="page-info">
          {pageNumber} / {numPages || "..."}
        </div>
      </footer>
    </div>
  );
}

export default DeckViewer;
