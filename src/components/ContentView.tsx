import { useState, useEffect } from "react";
import { deckService } from "../services/deckService";
import { analyticsService } from "../services/analyticsService";
import { useAuth } from "../contexts/AuthContext";
import { ContentStatsCard } from "./dashboard/ContentStatsCard";
import { DecksTable } from "./dashboard/DecksTable";

export function ContentView() {
  const [stats, setStats] = useState({ totalViews: 0, totalTimeSeconds: 0 });
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const fetchDecks = () => {
    if (session?.user?.id) {
      setLoading(true);
      Promise.all([
        analyticsService.getUserTotalStats(session.user.id),
        deckService.getDecksWithAnalytics(session.user.id),
      ])
        .then(([totalStats, decksWithStats]) => {
          setStats(totalStats);
          setDecks(decksWithStats);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [session]);

  const handleDelete = async (deck: any) => {
    try {
      await deckService.deleteDeck(deck.id, deck.file_url, deck.slug);
      fetchDecks(); // Refresh list
    } catch (err) {
      console.error("Failed to delete deck:", err);
      alert("Error deleting deck. Please try again.");
    }
  };

  return (
    <div className="space-y-12 pb-12">
      <ContentStatsCard
        totalViews={stats.totalViews}
        totalTimeSeconds={stats.totalTimeSeconds}
        loading={loading}
      />

      <DecksTable decks={decks} loading={loading} onDelete={handleDelete} />
    </div>
  );
}
