import { useState, useEffect, useCallback } from "react";
import { deckService } from "../services/deckService";
import { noteService } from "../services/noteService";
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
import {
  BookmarkMinus,
  ExternalLink,
  FileText,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

export function InboxView() {
  const { session } = useAuth();
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

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

  const startEditing = (deck: any) => {
    setEditingId(deck.id);
    setEditContent(deck.investor_note || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveNote = async (deckId: string) => {
    setIsSavingNote(true);
    try {
      await noteService.saveNote(deckId, editContent);
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deckId ? { ...d, investor_note: editContent } : d,
        ),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-700 relative">
      <p className="text-slate-500 font-medium -mb-6 md:-mb-4">
        Saved decks from other founders. Always up to date.
      </p>
      {isRefreshing && !loading && (
        <div className="absolute top-0 right-0 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-deckly-primary rounded-full animate-ping" />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
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
            decks.map((deck) => {
              const updatedDate = new Date(deck.updated_at);
              const lastViewedDate = new Date(deck.last_viewed_at || 0);
              const isNewUpdate =
                updatedDate > lastViewedDate &&
                Date.now() - updatedDate.getTime() < 7 * 24 * 60 * 60 * 1000;

              return (
                <div
                  key={deck.id}
                  className={cn(
                    "p-4 flex flex-col gap-3",
                    unsavingId === deck.id && "opacity-50",
                  )}
                >
                  <div className="flex items-start gap-3">
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
                        {isNewUpdate && (
                          <span className="px-1.5 py-0.5 bg-deckly-primary text-slate-950 text-[8px] font-black uppercase rounded-md animate-pulse shrink-0">
                            Updated
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Saved{" "}
                        {new Date(deck.saved_at)
                          .toLocaleDateString("en-GB")
                          .replace(/\//g, "-")}{" "}
                        · Viewed{" "}
                        {deck.last_viewed_at
                          ? new Date(deck.last_viewed_at)
                              .toLocaleDateString("en-GB")
                              .replace(/\//g, "-")
                          : "Never"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnsave(deck.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all"
                      title="Remove from Library"
                    >
                      <BookmarkMinus size={18} />
                    </button>
                  </div>

                  {/* Notes below the name (mobile) */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 group/note relative">
                    <div className="flex gap-2 items-start justify-start w-fit">
                      <div className="min-w-0">
                        {editingId === deck.id ? (
                          <div className="space-y-2 min-w-[200px]">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-deckly-primary/30 min-h-[80px]"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-700"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNote(deck.id)}
                                disabled={isSavingNote}
                                className="px-3 py-1 bg-deckly-primary text-slate-950 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {isSavingNote ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Check size={10} />
                                )}
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed font-medium italic">
                            {deck.investor_note
                              ? `"${deck.investor_note}"`
                              : "No notes yet..."}
                          </p>
                        )}
                      </div>

                      {editingId !== deck.id && (
                        <button
                          onClick={() => startEditing(deck)}
                          className="p-1 text-slate-400 hover:text-deckly-primary transition-colors hover:bg-white rounded-md shrink-0"
                          title="Edit Note"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
                  Notes
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
                        <div className="h-4 w-32 bg-slate-50 animate-pulse rounded" />
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="h-4 w-24 bg-slate-50 animate-pulse rounded" />
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
                  <TableCell colSpan={5} className="p-24 text-center">
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
                decks.map((deck) => {
                  const updatedDate = new Date(deck.updated_at);
                  const lastViewedDate = new Date(deck.last_viewed_at || 0);
                  const isNewUpdate =
                    updatedDate > lastViewedDate &&
                    Date.now() - updatedDate.getTime() <
                      7 * 24 * 60 * 60 * 1000;

                  return (
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
                              {isNewUpdate && (
                                <span className="px-1.5 py-0.5 bg-deckly-primary text-slate-950 text-[8px] font-black uppercase rounded-md animate-pulse">
                                  Updated
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-start gap-2 group/note relative w-fit">
                          <div className="min-w-0">
                            {editingId === deck.id ? (
                              <div
                                className="flex items-start gap-2 min-w-[200px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <textarea
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-deckly-primary/30 min-h-[60px]"
                                  autoFocus
                                />
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={handleSaveNote.bind(null, deck.id)}
                                    disabled={isSavingNote}
                                    className="p-1.5 bg-deckly-primary text-slate-950 rounded-lg disabled:opacity-50"
                                    title="Save"
                                  >
                                    {isSavingNote ? (
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Check size={12} />
                                    )}
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:text-slate-700"
                                    title="Cancel"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 line-clamp-2 italic font-medium max-w-[180px]">
                                {deck.investor_note ||
                                  "Click to add description..."}
                              </p>
                            )}
                          </div>

                          {editingId !== deck.id && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditing(deck);
                              }}
                              className="p-1 text-slate-400 hover:text-deckly-primary transition-all shrink-0"
                              title="Edit Note"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardCard>
    </div>
  );
}
