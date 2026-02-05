import { useState, useEffect } from "react";
import DeckList from "../components/DeckList";
import { deckService } from "../services/deckService";
import { Deck } from "../types";

function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const data = await deckService.getAllDecks();
      setDecks(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error loading decks:", err);
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

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading decks</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <DeckList
      decks={decks}
      loading={loading}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
    />
  );
}

export default Home;
