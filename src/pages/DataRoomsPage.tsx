import { useState, useEffect } from "react";
import { Plus, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataRoomCard } from "../components/dashboard/DataRoomCard";
import { DataRoom } from "../types";
import { dataRoomService } from "../services/dataRoomService";

function DataRoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<DataRoom[]>([]);
  const [roomMeta, setRoomMeta] = useState<
    Map<string, { docCount: number; visitors: number }>
  >(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await dataRoomService.getDataRooms();
        setRooms(data);

        // Load metadata for each room in parallel
        const metaEntries = await Promise.all(
          data.map(async (room) => {
            const [docCount, analytics] = await Promise.all([
              dataRoomService.getDocumentCount(room.id),
              dataRoomService.getDataRoomAnalytics(room.id),
            ]);
            return [
              room.id,
              { docCount, visitors: analytics.totalVisitors },
            ] as const;
          }),
        );
        setRoomMeta(new Map(metaEntries));
      } catch (err) {
        console.error("Failed to load data rooms", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout title="Data Rooms" showFab={false}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Data Rooms</h1>
            <p className="text-sm text-slate-500 mt-1">
              Bundle documents into shareable folders with access controls
            </p>
          </div>
          <button
            onClick={() => navigate("/rooms/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-deckly-primary text-slate-900 font-bold text-sm rounded-xl hover:bg-deckly-primary/90 transition-all active:scale-95"
          >
            <Plus size={16} />
            New Room
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Monitor size={28} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              No data rooms yet
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              Create a data room to bundle multiple documents into a single
              shareable link
            </p>
            <button
              onClick={() => navigate("/rooms/new")}
              className="flex items-center gap-2 px-5 py-2.5 bg-deckly-primary text-slate-900 font-bold text-sm rounded-xl hover:bg-deckly-primary/90 transition-all"
            >
              <Plus size={16} />
              Create Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const meta = roomMeta.get(room.id);
              return (
                <DataRoomCard
                  key={room.id}
                  room={room}
                  documentCount={meta?.docCount || 0}
                  totalVisitors={meta?.visitors || 0}
                />
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DataRoomsPage;
