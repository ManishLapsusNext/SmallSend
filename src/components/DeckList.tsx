import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Pencil,
  Trash2,
  Plus,
  Settings,
  Check,
  X,
  Upload,
  RotateCcw,
  LogOut,
  BarChart3,
} from "lucide-react";
import { deckService } from "../services/deckService";
import { supabase } from "../services/supabase";
import defaultBanner from "../assets/banner.png";
import AnalyticsModal from "./AnalyticsModal";
import DeckDetailPanel from "./DeckDetailPanel";
import { Deck } from "../types";
import { cn } from "../utils/cn";
import Button from "./common/Button";

interface DeckListProps {
  decks: Deck[];
  loading: boolean;
  onDelete: (deck: Deck) => void;
  onUpdate: (deck: Deck) => void;
}

function DeckList({ decks, loading, onDelete, onUpdate }: DeckListProps) {
  const [branding, setBranding] = useState({
    room_name: "Deckly",
    banner_url:
      "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2000",
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showBrandingMenu, setShowBrandingMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAnalyticsDeck, setSelectedAnalyticsDeck] =
    useState<Deck | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const data = await deckService.getBrandingSettings();
      if (data) {
        setBranding({
          room_name: data.room_name || "Deckly Data Room",
          banner_url: data.banner_url || "",
        });
      }
    } catch (err) {
      console.error("Error loading branding:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleStartEdit = () => {
    setEditValue(branding.room_name);
    setIsEditingTitle(true);
    setShowBrandingMenu(false);
  };

  const handleSaveTitle = async () => {
    if (editValue.trim() && editValue !== branding.room_name) {
      try {
        await deckService.updateBrandingSettings({ room_name: editValue });
        setBranding((prev) => ({ ...prev, room_name: editValue }));
      } catch (err: any) {
        alert("Failed to update room name: " + err.message);
      }
    }
    setIsEditingTitle(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;

    setUploading(true);
    setShowBrandingMenu(false);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/branding/banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("decks")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("decks").getPublicUrl(fileName);

      await deckService.updateBrandingSettings({ banner_url: publicUrl });
      setBranding((prev) => ({ ...prev, banner_url: publicUrl }));
    } catch (err: any) {
      alert("Failed to upload banner: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleResetBranding = async () => {
    if (!window.confirm("Reset branding to defaults?")) return;

    try {
      const defaults = { room_name: "Deckly Data Room", banner_url: "" };
      await deckService.updateBrandingSettings({
        room_name: defaults.room_name,
        banner_url: null,
      });
      setBranding(defaults);
      setShowBrandingMenu(false);
    } catch (err: any) {
      alert("Failed to reset branding: " + err.message);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, deck: Deck) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/${deck.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(deck.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header
        className="relative w-full h-[400px] flex items-center justify-center text-center overflow-hidden border-b border-white/5"
        style={{
          backgroundImage: `url(${branding.banner_url || defaultBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-deckly-background"></div>

        <div className="absolute top-8 right-8 z-20 flex flex-col items-end gap-2">
          <button
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/20 text-white",
              showBrandingMenu
                ? "bg-deckly-primary border-deckly-primary shadow-lg shadow-deckly-primary/40"
                : "bg-white/10 hover:bg-white/20",
            )}
            onClick={() => setShowBrandingMenu(!showBrandingMenu)}
            disabled={uploading}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Settings size={20} />
            )}
          </button>

          <AnimatePresence>
            {showBrandingMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-56 shadow-2xl flex flex-col gap-1.5"
              >
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 px-2">
                  Branding
                </h3>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-white/5 text-sm transition-colors text-slate-200"
                >
                  <Pencil size={14} /> Edit Room Name
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-white/5 text-sm transition-colors text-slate-200"
                >
                  <Upload size={14} /> Change Banner
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-white/5 text-sm transition-colors text-slate-200"
                >
                  <LogOut size={14} /> Sign Out
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={handleResetBranding}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors text-red-400"
                >
                  <RotateCcw size={14} /> Reset Defaults
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 w-full max-w-4xl px-4">
          <AnimatePresence mode="wait">
            {isEditingTitle ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-2 pl-6 rounded-full flex items-center gap-4 shadow-2xl mx-auto max-w-2xl"
              >
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="bg-transparent border-none outline-none text-2xl font-bold text-white w-full placeholder-slate-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTitle}
                    className="w-10 h-10 rounded-full bg-deckly-primary flex items-center justify-center text-white hover:bg-opacity-90 transition-all"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.h1
                key="display"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl"
              >
                {branding.room_name}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </header>

      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/*"
        onChange={handleBannerUpload}
      />

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-6 -mt-12 pb-24 relative z-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <div className="w-10 h-10 border-2 border-deckly-primary/20 border-t-deckly-primary rounded-full animate-spin" />
            <p>Gathering your decks...</p>
          </div>
        ) : !decks || decks.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-20 text-center flex flex-col items-center gap-6 shadow-xl">
            <div className="w-20 h-20 bg-deckly-primary/10 rounded-full flex items-center justify-center text-deckly-primary mb-2">
              <Plus size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Your data room is empty
            </h2>
            <p className="text-slate-400 max-w-sm">
              Start by uploading your first pitch deck. We'll handle the
              processing and analytics for you.
            </p>
            <Link to="/upload">
              <Button size="large" className="group">
                Upload First Deck{" "}
                <Plus
                  size={20}
                  className="ml-1 group-hover:rotate-90 transition-transform"
                />
              </Button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {decks.map((deck) => (
              <motion.div
                key={deck.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <Link
                  to={`/${deck.slug}`}
                  className="group relative flex flex-col h-[420px] bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-deckly-primary/50 transition-all duration-300 shadow-xl hover:shadow-deckly-primary/10"
                >
                  {/* Thumbnail area */}
                  <div className="h-48 relative overflow-hidden bg-slate-950">
                    {deck.pages && deck.pages.length > 0 ? (
                      <img
                        src={deck.pages[0].image_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-800 uppercase tracking-widest text-xs font-black">
                        Processing...
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                  </div>

                  {/* Content area */}
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-white leading-tight line-clamp-2 max-w-[70%]">
                        {deck.title}
                      </h2>
                      <div className="flex gap-1.5 translate-y-1">
                        <ActionButton
                          onClick={(e: any) => handleCopyLink(e, deck)}
                          title="Copy Link"
                          active={copiedId === deck.id}
                        >
                          <Share2 size={14} />
                          {copiedId === deck.id && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] px-2 py-1 rounded border border-white/10">
                              Copied!
                            </div>
                          )}
                        </ActionButton>
                        <ActionButton
                          onClick={(e: any) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedAnalyticsDeck(deck);
                          }}
                          title="Analytics"
                          color="indigo"
                        >
                          <BarChart3 size={14} />
                        </ActionButton>
                        <ActionButton
                          onClick={(e: any) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedDeck(deck);
                          }}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </ActionButton>
                        <ActionButton
                          onClick={(e: any) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(deck);
                          }}
                          title="Delete"
                          color="red"
                        >
                          <Trash2 size={14} />
                        </ActionButton>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1 italic">
                      {deck.description ||
                        "No description provided for this data room asset."}
                    </p>

                    <div className="flex items-center gap-2 text-deckly-primary text-sm font-bold group-hover:gap-3 transition-all">
                      Open Data Room <span>→</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Floating Action Button */}
      {!loading && decks && decks.length > 0 && (
        <Link
          to="/upload"
          className="fixed bottom-10 right-10 w-16 h-16 bg-deckly-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-deckly-primary/40 hover:scale-110 active:scale-95 transition-all z-[100] group"
        >
          <Plus
            size={32}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
        </Link>
      )}

      {/* Modals & Panels */}
      <AnimatePresence>
        {selectedDeck && (
          <DeckDetailPanel
            deck={selectedDeck}
            onClose={() => setSelectedDeck(null)}
            onDelete={(deck) => {
              onDelete(deck);
              setSelectedDeck(null);
            }}
            onShowAnalytics={(deck) => {
              setSelectedAnalyticsDeck(deck);
            }}
            onUpdate={(updatedDeck) => {
              onUpdate(updatedDeck);
              setSelectedDeck(updatedDeck);
            }}
          />
        )}
      </AnimatePresence>

      {selectedAnalyticsDeck && (
        <AnalyticsModal
          deck={selectedAnalyticsDeck}
          onClose={() => setSelectedAnalyticsDeck(null)}
        />
      )}
    </div>
  );
}

// Internal Helper Component for Action Buttons
function ActionButton({
  children,
  onClick,
  title,
  color = "default",
  active = false,
}: any) {
  const colors: any = {
    default: "hover:bg-deckly-primary hover:text-white",
    indigo: "hover:bg-indigo-500 hover:text-white",
    red: "hover:bg-red-500 hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "relative w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 text-slate-400 transition-all",
        colors[color],
        active
          ? "bg-deckly-primary text-white border-deckly-primary scale-110"
          : "hover:-translate-y-1",
      )}
    >
      {children}
    </button>
  );
}

export default DeckList;
