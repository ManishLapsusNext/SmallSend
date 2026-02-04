import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { analyticsService } from "../services/analyticsService";
import { Deck } from "../types";

interface ImageDeckViewerProps {
  deck: Deck;
}

function ImageDeckViewer({ deck }: ImageDeckViewerProps) {
  const pages = useMemo(
    () => (Array.isArray(deck?.pages) ? deck.pages : []),
    [deck?.pages],
  );
  const numPages = pages.length;

  const [currentPage, setCurrentPage] = useState(1);
  const startTimeRef = useRef(Date.now());

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
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
          No Pages Processed
        </h2>
        <p className="text-slate-400 font-medium">
          This asset is still being optimized. Please wait a moment.
        </p>
      </div>
    );
  }

  const currentImage = pages[currentPage - 1]?.image_url;

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] overflow-hidden">
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative h-full w-full flex items-center justify-center"
          >
            <img
              src={currentImage}
              alt={`Slide ${currentPage}`}
              className="max-h-full max-w-full object-contain shadow-[0_32px_128px_-12px_rgba(0,0,0,1)] rounded-sm"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        <div
          className="absolute inset-y-0 left-0 w-1/4 cursor-pointer"
          onClick={goToPrevPage}
          title="Previous"
        />
        <div
          className="absolute inset-y-0 right-0 w-1/4 cursor-pointer"
          onClick={goToNextPage}
          title="Next"
        />
      </div>

      <footer className="h-20 bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-center justify-center relative z-10 px-6">
        <div className="px-5 py-2 bg-white/5 rounded-full border border-white/5 text-slate-300 text-sm font-black tracking-widest uppercase">
          {currentPage} <span className="text-slate-600 mx-2">/</span>{" "}
          {numPages}
        </div>
      </footer>
    </div>
  );
}

export default ImageDeckViewer;
