import { Link } from "react-router-dom";

function DeckList({ decks, loading, onDelete }) {
  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">
          <p>Loading decks...</p>
        </div>
      </div>
    );
  }

  if (!decks || decks.length === 0) {
    return (
      <div className="home-page">
        <div className="empty-state">
          <h2>No decks available</h2>
          <p>Check back later for updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="hero-section">
        <h1>Level 29 Data Room</h1>
      </header>
      <div className="deck-list">
        {decks.map((deck) => (
          <Link key={deck.id} to={`/${deck.slug}`} className="deck-card">
            <div className="deck-thumbnail">
              {deck.pages && deck.pages.length > 0 && (
                <img src={deck.pages[0]} alt="" className="thumbnail-preview" />
              )}
            </div>
            <div className="deck-card-content">
              <div className="deck-header-row">
                <h2>{deck.title}</h2>
                {onDelete && (
                  <button
                    className="delete-deck-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(deck);
                    }}
                    title="Delete Deck"
                  >
                    ×
                  </button>
                )}
              </div>
              {deck.description ? (
                <p>{deck.description}</p>
              ) : (
                <p>Click to view this pitch deck and explore the details.</p>
              )}
              <div className="view-link">
                View Deck <span>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link to="/admin" className="fab-button" title="Upload New Deck">
        +
      </Link>
    </div>
  );
}

export default DeckList;
