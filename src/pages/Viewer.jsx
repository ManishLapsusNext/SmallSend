import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// 1. IMPORT THE NEW COMPONENT
import ImageDeckViewer from '../components/ImageDeckViewer'; 
import { deckService } from '../services/deckService';

function Viewer() {
  const { slug } = useParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDeck();
  }, [slug]);

  const loadDeck = async () => {
    try {
      const data = await deckService.getDeckBySlug(slug);
      setDeck(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading deck:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <Link to="/" className="back-link">← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="viewer-page">
      <Link to="/" className="back-link">← Back to all decks</Link>
      
      {/* 2. RENDER THE NEW COMPONENT */}
      <ImageDeckViewer deck={deck} />
    </div>
  );
}

export default Viewer;