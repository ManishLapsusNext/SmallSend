import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ImageDeckViewer from "../components/ImageDeckViewer";
import DeckViewer from "../components/DeckViewer";
import { deckService } from "../services/deckService";
import { analyticsService } from "../services/analyticsService";

function Viewer() {
  const { slug } = useParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDeck = useCallback(async () => {
    try {
      const data = await deckService.getDeckBySlug(slug);
      setDeck(data);
      analyticsService.trackDeckView(data);
    } catch (err) {
      setError(err.message);
      console.error("Error loading deck:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading deck...</p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="error-container">
        <h2>Deck not found</h2>
        <p>The requested deck could not be loaded.</p>
        <Link to="/" className="back-link">
          ← Back to home
        </Link>
      </div>
    );
  }

  // Determine which viewer to use
  const hasProcessedImages = Array.isArray(deck.pages) && deck.pages.length > 0;

  return (
    <div className="viewer-page">
      <Link to="/" className="back-link">
        ← Back to all decks
      </Link>

      {hasProcessedImages ? (
        <ImageDeckViewer deck={deck} />
      ) : (
        <DeckViewer deck={deck} />
      )}
    </div>
  );
}

export default Viewer;
