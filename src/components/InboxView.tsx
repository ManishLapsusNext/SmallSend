import { useState, useEffect, useCallback } from "react";
import { deckService } from "../services/deckService";
import { useAuth } from "../contexts/AuthContext";
import { DashboardCard } from "./ui/DashboardCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { BookmarkMinus, ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

export function InboxView() {
  const { session } = useAuth();
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  const fetchSavedDecks = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsRefreshing(true);
    try {
      const savedDecks = await deckService.getSavedDecks();
      setDecks(savedDecks);
    } catch (err) {
      console.error("Failed to fetch saved decks:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchSavedDecks();
  }, [fetchSavedDecks]);

  const handleUnsave = async (deckId: string) => {
    if (!window.confirm("Remove this deck from your library?")) return;
    setUnsavingId(deckId);
    try {
      await deckService.removeFromLibrary(deckId);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch (err) {
      console.error("Failed to unsave deck:", err);
    } finally {
      setUnsavingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700 relative">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Inbox
        </h2>
        <p className="text-slate-500 font-medium">
          Saved decks from other founders. Always up to date.
        </p>
      </div>

      {isRefreshing && !loading && (
        <div className="absolute top-0 right-0 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-deckly-primary rounded-full animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Syncing...
          </span>
        </div>
      )}

      <DashboardCard>
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-50">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="h-4 w-40 bg-slate-100 animate-pulse rounded" />
                  <div className="h-3 w-24 bg-slate-100 animate-pulse rounded" />
                </div>
              ))
          ) : decks.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                <FileText size={32} />
              </div>
              <p className="text-slate-400 text-sm font-medium">
                Your inbox is empty. Save decks while viewing them to see them
                here.
              </p>
            </div>
          ) : (
            decks.map((deck) => (
              <div
                key={deck.id}
                className={cn(
                  "p-4 flex items-center gap-3",
                  unsavingId === deck.id && "opacity-50",
                )}
              >
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/${deck.slug}`}
                      target="_blank"
                      className="font-bold text-slate-900 text-sm truncate block hover:text-deckly-primary"
                    >
                      {deck.title}
                    </Link>
                    {(() => {
                      const updatedDate = new Date(deck.updated_at);
                      const lastViewedDate = new Date(deck.last_viewed_at || 0);
                      const isNewUpdate =
                        updatedDate > lastViewedDate &&
                        Date.now() - updatedDate.getTime() <
                          7 * 24 * 60 * 60 * 1000;
                      if (isNewUpdate) {
                        return (
                          <span className="px-1.5 py-0.5 bg-deckly-primary text-slate-950 text-[8px] font-black uppercase rounded-md animate-pulse shrink-0">
                            Updated
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                      Saved {new Date(deck.saved_at).toLocaleDateString()}
                    </p>
                    <span className="text-slate-300">•</span>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                      Viewed{" "}
                      {deck.last_viewed_at
                        ? new Date(deck.last_viewed_at).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsave(deck.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all"
                  title="Remove from Library"
                >
                  <BookmarkMinus size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 px-8">
                  Name
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">
                  Saved On
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">
                  Last Viewed
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right px-8">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i} className="border-slate-50">
                      <TableCell className="px-8 py-6">
                        <div className="h-4 w-48 bg-slate-50 animate-pulse rounded" />
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="h-4 w-24 bg-slate-50 animate-pulse rounded" />
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <div className="h-8 w-8 bg-slate-50 animate-pulse rounded-lg ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : decks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <FileText size={32} />
                      </div>
                      <p className="font-medium max-w-xs mx-auto">
                        Your inbox is empty. Save decks while viewing them to
                        keep track of them here.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                decks.map((deck) => (
                  <TableRow
                    key={deck.id}
                    className={cn(
                      "group hover:bg-slate-50/50 border-slate-50 transition-colors",
                      unsavingId === deck.id &&
                        "opacity-50 pointer-events-none",
                    )}
                  >
                    <TableCell className="px-8 py-6">
                      <Link
                        to={`/${deck.slug}`}
                        target="_blank"
                        className="flex items-center gap-3 group/title"
                      >
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-deckly-primary transition-colors group-hover/title:bg-deckly-primary/10">
                          <FileText size={18} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 group-hover/title:text-deckly-primary transition-colors">
                              {deck.title}
                            </span>
                            {(() => {
                              const updatedDate = new Date(deck.updated_at);
                              const lastViewedDate = new Date(
                                deck.last_viewed_at || 0,
                              );
                              const isNewUpdate =
                                updatedDate > lastViewedDate &&
                                Date.now() - updatedDate.getTime() <
                                  7 * 24 * 60 * 60 * 1000;
                              if (isNewUpdate) {
                                return (
                                  <span className="px-1.5 py-0.5 bg-deckly-primary text-slate-950 text-[8px] font-black uppercase rounded-md animate-pulse">
                                    Updated
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="py-6 text-slate-500 font-bold text-xs">
                      {new Date(deck.saved_at)
                        .toLocaleDateString("en-GB")
                        .replace(/\//g, "-")}
                    </TableCell>
                    <TableCell className="py-6 text-slate-500 font-bold text-xs">
                      {deck.last_viewed_at
                        ? new Date(deck.last_viewed_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "Never"}
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/${deck.slug}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-deckly-primary hover:bg-white rounded-lg transition-all"
                          title="Open Deck"
                        >
                          <ExternalLink size={18} />
                        </Link>
                        <button
                          onClick={() => handleUnsave(deck.id)}
                          disabled={unsavingId === deck.id}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                          title="Remove from Library"
                        >
                          <BookmarkMinus size={18} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardCard>
    </div>
  );
}
