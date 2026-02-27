import { useNavigate } from "react-router-dom";
import { Monitor, FileText, Eye } from "lucide-react";
import { DataRoom } from "../../types";

interface DataRoomCardProps {
  room: DataRoom;
  documentCount: number;
  totalVisitors: number;
}

export function DataRoomCard({
  room,
  documentCount,
  totalVisitors,
}: DataRoomCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/rooms/${room.id}`)}
      className="w-full text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-deckly-primary/40 hover:shadow-lg hover:shadow-deckly-primary/5 transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-deckly-primary/30 transition-colors">
          {room.icon_url ? (
            <img
              src={room.icon_url}
              alt={room.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <Monitor
              size={20}
              className="text-slate-400 group-hover:text-deckly-primary transition-colors"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate group-hover:text-deckly-primary transition-colors">
            {room.name}
          </h3>
          {room.description && (
            <p className="text-sm text-slate-500 truncate mt-0.5">
              {room.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileText size={13} />
              {documentCount} {documentCount === 1 ? "doc" : "docs"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Eye size={13} />
              {totalVisitors} {totalVisitors === 1 ? "visitor" : "visitors"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
