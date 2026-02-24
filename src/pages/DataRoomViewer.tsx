import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertCircle, FileText, ChevronRight } from "lucide-react";
import ImageDeckViewer from "../components/ImageDeckViewer";
import DeckViewer from "../components/DeckViewer";
import AccessGate from "../components/AccessGate";
import { dataRoomService } from "../services/dataRoomService";
import { analyticsService } from "../services/analyticsService";
import { supabase } from "../services/supabase";
import { DataRoom, DataRoomDocument, Deck } from "../types";
import Button from "../components/common/Button";

function DataRoomViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [room, setRoom] = useState<DataRoom | null>(null);
  const [documents, setDocuments] = useState<DataRoomDocument[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [viewerEmail, setViewerEmail] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadRoom = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await dataRoomService.getDataRoomBySlug(slug);
      if (!data) {
        setError("Data room not found");
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This data room link has expired.");
        return;
      }

      setRoom(data);

      const docs = await dataRoomService.getDocuments(data.id);
      setDocuments(docs);

      // Auto-select first document
      if (docs.length > 0 && docs[0].deck) {
        setSelectedDeck(docs[0].deck);
      }

      // Check if current user is the owner
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const isOwner = session?.user?.id === data.user_id;

      // Skip access gate if no protection or user is owner
      if ((!data.require_email && !data.require_password) || isOwner) {
        setIsUnlocked(true);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error loading data room:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Track view when a document is selected
  useEffect(() => {
    if (isUnlocked && selectedDeck) {
      analyticsService.trackDeckView(
        selectedDeck,
        viewerEmail ? { email_captured: viewerEmail } : undefined,
      );
    }
  }, [selectedDeck?.id, isUnlocked]);

  // Build a fake Deck object for AccessGate compatibility
  const roomAsDeck = room
    ? ({
        id: room.id,
        title: room.name,
        slug: room.slug,
        require_email: room.require_email,
        require_password: room.require_password,
        view_password: room.view_password,
      } as Deck)
    : null;

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
              Loading Data Room
            </p>
          </motion.div>
        ) : error || !room ? (
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
                {error ||
                  "The data room you're looking for might have been moved or the link has expired."}
              </p>
              <Link to="/">
                <Button size="large" fullWidth icon={ArrowLeft}>
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : !isUnlocked && roomAsDeck ? (
          <AccessGate
            deck={roomAsDeck}
            onAccessGranted={(email) => {
              setIsUnlocked(true);
              if (email) setViewerEmail(email);
            }}
          />
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-stretch relative"
          >
            {/* ── Document Sidebar ── */}
            <div
              className={`${
                sidebarOpen ? "w-72" : "w-0"
              } bg-[#0e1117] border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden shrink-0`}
            >
              {/* Room Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {room.icon_url ? (
                    <img
                      src={room.icon_url}
                      alt={room.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-deckly-primary/10 flex items-center justify-center">
                      <FileText size={18} className="text-deckly-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-white truncate">
                      {room.name}
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                      {documents.length}{" "}
                      {documents.length === 1 ? "Document" : "Documents"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {documents.map((doc) => {
                  const deck = doc.deck;
                  const isActive = selectedDeck?.id === deck?.id;

                  return (
                    <button
                      key={doc.deck_id}
                      onClick={() => deck && setSelectedDeck(deck)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-deckly-primary/10 border border-deckly-primary/30"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
                        {deck?.pages?.[0]?.image_url ? (
                          <img
                            src={deck.pages[0].image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText size={14} className="text-slate-600" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? "text-deckly-primary" : "text-slate-300"
                          }`}
                        >
                          {deck?.title || "Untitled"}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {deck?.pages?.length || 0} pages
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5">
                <p className="text-[9px] text-slate-600 text-center uppercase tracking-[0.15em] font-bold">
                  Powered by Deckly
                </p>
              </div>
            </div>

            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute top-4 z-10 p-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full text-slate-400 hover:text-white transition-all"
              style={{ left: sidebarOpen ? "17rem" : "0.5rem" }}
            >
              <ChevronRight
                size={16}
                className={`transition-transform ${sidebarOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* ── Main Viewer ── */}
            <div className="flex-1 flex flex-col items-stretch relative">
              {/* Back to room */}
              <Link to="/" className="absolute top-6 right-6 z-[100] group">
                <div className="flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-black/60 transition-all group-hover:-translate-x-1">
                  <ArrowLeft size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Leave Room
                  </span>
                </div>
              </Link>

              <div className="flex-1 w-full h-full relative">
                {selectedDeck ? (
                  Array.isArray(selectedDeck.pages) &&
                  selectedDeck.pages.length > 0 ? (
                    <ImageDeckViewer
                      deck={selectedDeck}
                      viewerEmail={viewerEmail}
                    />
                  ) : (
                    <DeckViewer deck={selectedDeck} />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <FileText size={48} className="mb-4 opacity-30" />
                    <p className="text-sm font-medium">
                      Select a document to view
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DataRoomViewer;
