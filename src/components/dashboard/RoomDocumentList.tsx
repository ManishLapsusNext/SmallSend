import { GripVertical, Trash2, FileText } from "lucide-react";
import { DataRoomDocument } from "../../types";
import { useState, useRef } from "react";

interface RoomDocumentListProps {
  documents: DataRoomDocument[];
  onRemove: (deckId: string) => void;
  onReorder: (orderedDeckIds: string[]) => void;
}

export function RoomDocumentList({
  documents,
  onRemove,
  onReorder,
}: RoomDocumentListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragItemRef.current === null || dragItemRef.current === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...documents];
    const [moved] = items.splice(dragItemRef.current, 1);
    items.splice(index, 0, moved);

    onReorder(items.map((d) => d.deck_id));
    setDragIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <FileText size={36} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">No documents added yet</p>
        <p className="text-xs mt-1">Click "Add Documents" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {documents.map((doc, index) => {
        const deck = doc.deck;
        const isDragging = dragIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={doc.deck_id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              isDragging
                ? "opacity-50 border-deckly-primary/30 bg-deckly-primary/5"
                : isDragOver
                  ? "border-deckly-primary/50 bg-deckly-primary/5"
                  : "border-transparent hover:bg-slate-50"
            }`}
          >
            {/* Drag handle */}
            <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
              <GripVertical size={16} />
            </div>

            {/* Order number */}
            <span className="text-xs font-bold text-slate-300 w-5 text-center shrink-0">
              {index + 1}
            </span>

            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
              {deck?.pages?.[0]?.image_url ? (
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
                {deck?.title || "Untitled"}
              </p>
              <p className="text-xs text-slate-400">
                {deck?.pages?.length || 0} pages
              </p>
            </div>

            {/* Remove */}
            <button
              onClick={() => onRemove(doc.deck_id)}
              className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title="Remove from room"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
