import { useState, useEffect } from "react";
import DeckList from "../components/DeckList";
import { deckService } from "../services/deckService";
import { Deck, BrandingSettings } from "../types";
import { useAuth } from "../contexts/AuthContext";

function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user) {
      loadInitialData(session.user.id);
    }
  }, [session]);

  const loadInitialData = async (userId: string) => {
    try {
      // Parallel fetch branding and decks
      const [decksData, brandingData] = await Promise.all([
        deckService.getAllDecks(userId),
        deckService.getBrandingSettings(userId),
      ]);

      setDecks(decksData);
      setBranding(brandingData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deck: Deck) => {
    if (!window.confirm(`Are you sure you want to delete "${deck.title}"?`))
      return;

    try {
      await deckService.deleteDeck(deck.id, deck.file_url, deck.slug);
      setDecks((prev) => prev.filter((d) => d.id !== deck.id));
    } catch (err: any) {
      alert(`Failed to delete deck: ${err.message}`);
    }
  };

  const handleUpdate = (updatedDeck: Deck) => {
    setDecks((prev) =>
      prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)),
    );
  };

  const handleBrandingUpdate = (updatedBranding: Partial<BrandingSettings>) => {
    setBranding((prev) => (prev ? { ...prev, ...updatedBranding } : null));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-deckly-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 mb-8 text-red-500">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Error loading decks
        </h2>
        <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed mb-8">
          {error.includes("fetch") || error.includes("Network")
            ? "We're having trouble reaching the server. This can happen after a period of inactivity."
            : error}
        </p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            if (session?.user) loadInitialData(session.user.id);
          }}
          className="px-8 py-3 bg-white text-slate-950 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  const defaultBranding = {
    room_name: "Deckly Data Room",
    banner_url:
      "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2000",
  };

  return (
    <DeckList
      decks={decks}
      branding={
        branding
          ? {
              room_name: branding.room_name || defaultBranding.room_name,
              banner_url: branding.banner_url || defaultBranding.banner_url,
            }
          : defaultBranding
      }
      loading={loading}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
      onBrandingUpdate={handleBrandingUpdate}
    />
  );
}

export default Home;
