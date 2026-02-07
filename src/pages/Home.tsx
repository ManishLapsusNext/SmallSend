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
      console.error("Error loading dashboard data:", err);
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
      <div className="error-container">
        <h2>Error loading decks</h2>
        <p>{error}</p>
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
