import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertCircle } from "lucide-react";
import ImageDeckViewer from "../components/ImageDeckViewer";
import DeckViewer from "../components/DeckViewer";
import { deckService } from "../services/deckService";
import { analyticsService } from "../services/analyticsService";
import { Deck } from "../types";
import Button from "../components/common/Button";

function Viewer() {
  const { slug } = useParams<{ slug: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeck = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await deckService.getDeckBySlug(slug);
      setDeck(data);
      analyticsService.trackDeckView(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error loading deck:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  return (
    <div className="fixed inset-0 bg-[#090b10] flex flex-col items-stretch overflow-hidden">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-white/5" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-t-4 border-deckly-primary animate-spin" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">
              Loading Room Contents
            </p>
          </motion.div>
        ) : error || !deck ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-12 text-center shadow-2xl">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-8">
                <AlertCircle size={40} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight mb-4">
                Access Restricted
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed mb-10">
                The document you're looking for might have been moved or the
                link has expired.
              </p>
              <Link to="/">
                <Button size="large" fullWidth icon={ArrowLeft}>
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-stretch relative"
          >
            <Link to="/" className="absolute top-6 left-6 z-[100] group">
              <div className="flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-black/60 transition-all group-hover:-translate-x-1">
                <ArrowLeft size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Leave Room
                </span>
              </div>
            </Link>

            <div className="flex-1 w-full h-full relative">
              {Array.isArray(deck.pages) && deck.pages.length > 0 ? (
                <ImageDeckViewer deck={deck} />
              ) : (
                <DeckViewer deck={deck} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Viewer;
