import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DashboardCard } from "../components/ui/DashboardCard";
import { Button } from "../components/ui/button";
import { DeckSettingsForm } from "../components/dashboard/DeckSettingsForm";
import { deckService } from "../services/deckService";
import { Deck } from "../types";
import { useAuth } from "../contexts/AuthContext";

export default function EditDeck() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deckId && session?.user?.id) {
      setLoading(true);
      deckService
        .getDeckById(deckId)
        .then((data) => setDeck(data))
        .catch((err) => console.error("Failed to load deck:", err))
        .finally(() => setLoading(false));
    }
  }, [deckId, session]);

  if (loading) {
    return (
      <DashboardLayout title="Edit Asset">
        <div className="flex-1 flex flex-col items-center justify-center py-40 gap-4 text-slate-400">
          <div className="w-10 h-10 border-2 border-deckly-primary/20 border-t-deckly-primary rounded-full animate-spin" />
          <p className="font-medium font-bold uppercase tracking-widest text-[10px]">
            Loading Asset Details...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!deck) {
    return (
      <DashboardLayout title="Edit Asset">
        <div className="flex-1 flex flex-col items-center justify-center py-40 gap-4 text-slate-400">
          <p className="font-medium font-bold uppercase tracking-widest text-xs">
            Asset not found.
          </p>
          <Button onClick={() => navigate("/")} variant="ghost">
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Asset">
      <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/content")}
            className="text-slate-400 hover:text-slate-900 px-2"
          >
            <ChevronLeft size={16} className="mr-2" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Back to Content
            </span>
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">
            Edit {deck.title}
          </h2>
          <div className="w-32" /> {/* Spacer */}
        </div>

        <DashboardCard className="p-10">
          <DeckSettingsForm
            deck={deck}
            onUpdate={setDeck}
            onDelete={async (id) => {
              await deckService.deleteDeck(id, deck.file_url, deck.slug);
              navigate("/");
            }}
          />
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
