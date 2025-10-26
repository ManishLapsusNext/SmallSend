import { Link } from 'react-router-dom'

function DeckList({ decks, loading }) {
  if (loading) {
    return (
      <div className="loading">
        <p>Loading decks...</p>
      </div>
    )
  }

  if (!decks || decks.length === 0) {
    return (
      <div className="empty-state">
        <h2>No decks available</h2>
        <p>Check back later for updates</p>
      </div>
    )
  }

  return (
    <div className="deck-list">
      <h1>Level 29 Data Room</h1>
      <div className="deck-grid">
        {decks.map((deck) => (
          <Link 
            key={deck.id} 
            to={`/${deck.slug}`} 
            className="deck-card"
          >
            <div className="deck-card-content">
              <h2>{deck.title}</h2>
              {deck.description && (
                <p>{deck.description}</p>
              )}
              <span className="view-link">View →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default DeckList