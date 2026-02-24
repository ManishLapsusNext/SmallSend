import { useState, useEffect } from "react";
import { Plus, Monitor, Lock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataRoomCard } from "../components/dashboard/DataRoomCard";
import { DataRoom } from "../types";
import { dataRoomService } from "../services/dataRoomService";
import { useAuth } from "../contexts/AuthContext";
import { TIER_CONFIG, Tier } from "../constants/tiers";

function DataRoomsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<DataRoom[]>([]);
  const [roomMeta, setRoomMeta] = useState<
    Map<string, { docCount: number; visitors: number }>
  >(new Map());
  const [loading, setLoading] = useState(true);

  const tier: Tier = (profile?.tier as Tier) || "FREE";
  const tierConfig = TIER_CONFIG[tier];
  const maxRooms = tierConfig.maxDataRooms;
  const isAtLimit = rooms.length >= maxRooms;
  const isUnlimited = maxRooms === Infinity;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await dataRoomService.getDataRooms();
        setRooms(data);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Data Rooms</h1>
            <p className="text-sm text-slate-500 mt-1">
              Bundle documents into shareable folders with access controls
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Usage indicator */}
            {!loading && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(maxRooms, 5) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i < rooms.length ? "bg-deckly-primary" : "bg-slate-200"
                      }`}
                    />
                  ))}
                  {isUnlimited && (
                    <span className="text-[9px] font-black text-slate-400 ml-1">
                      ∞
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  {rooms.length}
                  {!isUnlimited && `/${maxRooms}`} rooms
                </span>
              </div>
            )}

            {/* Create button */}
            <button
              onClick={() => !isAtLimit && navigate("/rooms/new")}
              disabled={isAtLimit}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all active:scale-95 ${
                isAtLimit
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-deckly-primary text-slate-900 hover:bg-deckly-primary/90"
              }`}
            >
              {isAtLimit ? <Lock size={16} /> : <Plus size={16} />}
              New Room
            </button>
          </div>
        </div>

        {/* Upgrade banner */}
        {isAtLimit && !isUnlimited && (
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Zap size={20} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">
                {tier === "FREE"
                  ? "Upgrade to Pro for up to 5 data rooms"
                  : "Upgrade to Pro+ for unlimited data rooms"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                You've used all {maxRooms} data room{maxRooms > 1 ? "s" : ""} on
                your {tier === "FREE" ? "Free" : "Pro"} plan.
              </p>
            </div>
            <button className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-colors shrink-0">
              Upgrade
            </button>
          </div>
        )}

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
