import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDeckAnalytics } from '../hooks/useDeckAnalytics';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function DeckViewer({ deck }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Custom hooks for handling logic
  const { trackCurrentPage } = useDeckAnalytics(deck, pageNumber, numPages);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    if (numPages) {
      setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
    }
  }, [numPages]);

  // Set up keyboard controls with stable callbacks
  useKeyboardControls(goToPrevPage, goToNextPage);
  
  const handleNavigationClick = (direction) => {
    // Manually track page before navigating
    trackCurrentPage(); 
    if (direction === 'next') {
      goToNextPage();
    } else {
      goToPrevPage();
    }
  };

  return (
    <div className="deck-viewer">
      <header className="viewer-header">
        <h1>{deck.title}</h1>
        <div className="page-info">
          Page {pageNumber} of {numPages || '...'}
        </div>
      </header>

      <main className="pdf-container">
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
          />
        </Document>
      </main>

      <nav className="navigation">
        <button 
          onClick={() => handleNavigationClick('prev')}
          disabled={pageNumber <= 1}
          className="nav-button"
        >
          ← Previous
        </button>
        
        <button 
          onClick={() => handleNavigationClick('next')}
          disabled={pageNumber >= numPages}
          className="nav-button"
        >
          Next →
        </button>
      </nav>
    </div>
  );
}

export default DeckViewer;