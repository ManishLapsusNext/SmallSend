import { useState, useEffect } from 'react'
import DeckList from '../components/DeckList'
import { deckService } from '../services/deckService'

function Home() {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDecks()
  }, [])

  const loadDecks = async () => {
    try {
      const data = await deckService.getAllDecks()
      setDecks(data)
    } catch (err) {
      setError(err.message)
      console.error('Error loading decks:', err)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading decks</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="home-page">
      <DeckList decks={decks} loading={loading} />
    </div>
  )
}

export default Home