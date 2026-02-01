import { Link } from "react-router-dom";
import { Share2, Pencil, Trash2, Plus } from "lucide-react";

function DeckList({ decks, loading, onDelete }) {
  return (
    <div className="home-page">
      <header className="hero-section">
        <div className="hero-content">
          <h1>SmallSend Data Room</h1>
        </div>
      </header>

      <main className="home-container">
        <div className="deck-list">
          {loading ? (
            <div className="loading">
              <p>Loading decks...</p>
            </div>
          ) : !decks || decks.length === 0 ? (
            <div className="empty-state">
              <h2>No decks available</h2>
              <p>Check back later for updates</p>
            </div>
          ) : (
            <div className="deck-grid">
              {decks.map((deck) => (
                <Link key={deck.id} to={`/${deck.slug}`} className="deck-card">
                  <div className="deck-thumbnail">
                    {deck.pages && deck.pages.length > 0 && (
                      <img
                        src={deck.pages[0]}
                        alt=""
                        className="thumbnail-preview"
                      />
                    )}
                  </div>
                  <div className="deck-card-content">
                    <div className="deck-header-row">
                      <h2>{deck.title}</h2>
                      <div className="card-actions">
                        <button
                          className="share-deck-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const url = `${window.location.origin}/${deck.slug}`;
                            navigator.clipboard.writeText(url);
                            e.currentTarget.classList.add("copied");
                            setTimeout(() => {
                              const btn = document.querySelector(
                                ".share-deck-btn.copied",
                              );
                              if (btn) btn.classList.remove("copied");
                            }, 2000);
                          }}
                          title="Copy Link"
                        >
                          <Share2 size={16} />
                          <span className="copied-toast">Copied!</span>
                        </button>
                        <Link
                          to={`/admin?edit=${deck.id}`}
                          className="edit-deck-btn"
                          onClick={(e) => e.stopPropagation()}
                          title="Replace/Edit Deck"
                        >
                          <Pencil size={16} />
                        </Link>
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
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    {deck.description ? (
                      <p>{deck.description}</p>
                    ) : (
                      <p>
                        Click to view this pitch deck and explore the details.
                      </p>
                    )}
                    <div className="view-link">
                      View Deck <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Link to="/admin" className="fab-button" title="Upload New Deck">
        <Plus size={32} />
      </Link>
    </div>
  );
}

export default DeckList;
