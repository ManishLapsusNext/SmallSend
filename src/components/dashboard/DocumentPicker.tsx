import { useState, useEffect, useCallback } from "react";
import { X, Search, FileText, Check } from "lucide-react";
import { Deck } from "../../types";
import { deckService } from "../../services/deckService";

interface DocumentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (deckIds: string[]) => void;
  excludeDeckIds: string[];
}

export function DocumentPicker({
  isOpen,
  onClose,
  onAdd,
  excludeDeckIds,
}: DocumentPickerProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDecks = useCallback(async () => {
    setLoading(true);
    try {
      const all = await deckService.getAllDecks();
      setDecks(all.filter((d) => !excludeDeckIds.includes(d.id)));
    } catch (err) {
      console.error("Failed to load decks", err);
    } finally {
      setLoading(false);
    }
  }, [excludeDeckIds]);

  useEffect(() => {
    if (isOpen) {
      loadDecks();
      setSelected(new Set());
      setSearch("");
    }
  }, [isOpen, loadDecks]);

  const filtered = decks.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    onAdd(Array.from(selected));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add Documents</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search decks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deckly-primary/30 focus:border-deckly-primary text-slate-700"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              Loading decks...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FileText size={32} className="mb-2 opacity-50" />
              <p className="text-sm">
                {decks.length === 0
                  ? "No decks available"
                  : "No matching decks"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((deck) => {
                const isSelected = selected.has(deck.id);
                return (
                  <button
                    key={deck.id}
                    onClick={() => toggleSelect(deck.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-deckly-primary/10 border border-deckly-primary/30"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "bg-deckly-primary border-deckly-primary"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>

                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      {deck.pages?.[0]?.image_url ? (
                        <img
                          src={deck.pages[0].image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText size={16} className="text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {deck.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {deck.pages?.length || 0} pages
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0}
              className="px-5 py-2 bg-deckly-primary text-slate-900 text-sm font-bold rounded-xl hover:bg-deckly-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add {selected.size > 0 ? `(${selected.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
