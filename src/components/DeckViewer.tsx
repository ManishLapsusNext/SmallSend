import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    trackCurrentPage();
    if (direction === "next") {
      goToNextPage();
    } else {
      goToPrevPage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] overflow-hidden">
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={pageNumber}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative shadow-2xl rounded-sm overflow-hidden bg-white max-h-full"
          >
            <Document
              file={deck.file_url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center gap-4 p-20">
                  <div className="w-10 h-10 border-2 border-deckly-primary/30 border-t-deckly-primary rounded-full animate-spin" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    Loading PDF
                  </p>
                </div>
              }
              error={
                <div className="p-10 text-red-500 font-bold">
                  Failed to load asset.
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                scale={2.0}
                loading=""
              />
            </Document>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays & Visual Arrows */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div
            className="flex-1 cursor-pointer group/nav overflow-hidden pointer-events-auto relative"
            onClick={() => handleNavigationClick("prev")}
            title="Previous Page"
          >
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white opacity-40 group-hover/nav:opacity-100 -translate-x-2 group-hover/nav:translate-x-0 transition-all duration-300 shadow-2xl">
              <ChevronLeft size={32} />
            </div>
          </div>
          <div
            className="flex-1 cursor-pointer group/nav overflow-hidden pointer-events-auto relative"
            onClick={() => handleNavigationClick("next")}
            title="Next Page"
          >
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white opacity-40 group-hover/nav:opacity-100 translate-x-2 group-hover/nav:translate-x-0 transition-all duration-300 shadow-2xl">
              <ChevronRight size={32} />
            </div>
          </div>
        </div>
      </div>

      <footer className="h-20 bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-center justify-center relative z-10 px-6">
        <div className="px-5 py-2 bg-white/5 rounded-full border border-white/5 text-slate-300 text-sm font-black tracking-widest uppercase">
          {pageNumber} <span className="text-slate-600 mx-2">/</span>{" "}
          {numPages || "..."}
        </div>
      </footer>
    </div>
  );
}

export default DeckViewer;
