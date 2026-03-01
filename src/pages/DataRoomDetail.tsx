import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  Link as LinkIcon,
  Copy,
  Check,
  Pencil,
  Trash2,
  ExternalLink,
  BarChart3,
  Users,
  Loader2,
  Monitor,
  X,
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DocumentPicker } from "../components/dashboard/DocumentPicker";
import { DataRoom, DataRoomDocument } from "../types";
import { dataRoomService } from "../services/dataRoomService";

/* ───────── helpers ───────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ───────── main page ───────── */
function DataRoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Data
  const [room, setRoom] = useState<DataRoom | null>(null);
  const [documents, setDocuments] = useState<DataRoomDocument[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalVisitors: number;
    perDeck: { deckId: string; title: string; visitors: number }[];
  }>({ totalVisitors: 0, perDeck: [] });

  // UI
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  /* ── load data ── */
  const loadAll = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const [roomData, docs, analyticsData] = await Promise.all([
        dataRoomService.getDataRoomById(roomId),
        dataRoomService.getDocuments(roomId),
        dataRoomService.getDataRoomAnalytics(roomId),
      ]);
      if (!roomData) {
        navigate("/rooms");
        return;
      }
      setRoom(roomData);
      setDocuments(docs);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to load room", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ── actions ── */
  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}/room/${room.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddDocuments = async (deckIds: string[]) => {
    if (!roomId) return;
    await dataRoomService.addDocuments(roomId, deckIds);
    loadAll();
  };

  const handleRemoveDocument = async (deckId: string) => {
    if (!roomId) return;
    setDeletingDoc(deckId);
    try {
      await dataRoomService.removeDocument(roomId, deckId);
      setDocuments((prev) => prev.filter((d) => d.deck_id !== deckId));
      setAnalytics((prev) => ({
        ...prev,
        perDeck: prev.perDeck.filter((p) => p.deckId !== deckId),
      }));
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId) return;
    await dataRoomService.deleteDataRoom(roomId);
    navigate("/rooms");
  };

  const shareUrl = room ? `${window.location.origin}/room/${room.slug}` : "";

  /* ── loading state ── */
  if (loading) {
    return (
      <DashboardLayout title="Data Rooms" showFab={false}>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="text-deckly-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!room) return null;

  const visitorsByDeck = new Map(
    analytics.perDeck.map((p) => [p.deckId, p.visitors]),
  );

  return (
    <DashboardLayout title="Data Rooms" showFab={false}>
      <div className="space-y-0">
        {/* ═══════════════ HERO BANNER ═══════════════ */}
        <div className="relative overflow-hidden bg-[#090b10] border-b border-white/5 py-12">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Glow accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-deckly-primary/10 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

          <div className="relative z-10 max-w-5xl mx-auto px-6">
            {/* Back button */}
            <button
              onClick={() => navigate("/rooms")}
              className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] mb-12 group transition-all"
            >
              <ArrowLeft
                size={14}
                className="group-hover:-translate-x-1 transition-transform"
              />
              All Rooms
            </button>

            {/* Center content */}
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden mb-8 shadow-2xl backdrop-blur-md relative group">
                <div className="absolute inset-0 bg-deckly-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {room.icon_url ? (
                  <img
                    src={room.icon_url}
                    alt={room.name}
                    className="w-full h-full object-cover rounded-[1.5rem]"
                  />
                ) : (
                  <Monitor
                    size={32}
                    className="text-slate-500 group-hover:text-deckly-primary transition-colors duration-500"
                  />
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 uppercase tracking-[0.05em]">
                {room.name}
              </h1>

              {room.description && (
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.15em] max-w-md mb-8 leading-relaxed">
                  {room.description}
                </p>
              )}

              {/* Action pills */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-deckly-primary" />
                      Link Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Share Room
                    </>
                  )}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all active:scale-95"
                >
                  <ExternalLink size={14} />
                  Live Preview
                </a>
                <button
                  onClick={() => navigate(`/rooms/${roomId}/edit`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all active:scale-95"
                >
                  <Pencil size={14} />
                  Manage
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-all active:scale-95"
                >
                  <Trash2 size={14} />
                  Erase
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ STATS ROW ═══════════════ */}
        <div className="bg-[#0e1117] border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-0">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
              <StatItem
                icon={<FileText size={16} />}
                label="Assets Gated"
                value={documents.length}
              />
              <StatItem
                icon={<Users size={16} />}
                label="Total Reach"
                value={analytics.totalVisitors}
              />
              <StatItem
                icon={<Calendar size={16} />}
                label="ESTABLISHED"
                value={formatDate(room.created_at)}
                isText
              />
              <StatItem
                icon={<LinkIcon size={16} />}
                label="Public Link"
                value={`/room/${room.slug}`}
                isText
              />
            </div>
          </div>
        </div>

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* ── Documents Section ── */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-deckly-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Room Assets
                </h2>
                <span className="ml-1 px-3 py-1 bg-deckly-primary/10 text-deckly-primary text-[10px] font-black rounded-lg border border-deckly-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  {documents.length}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => navigate(`/upload?returnToRoom=${roomId}`)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
                >
                  <Plus size={14} />
                  Upload
                </button>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-deckly-primary text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-deckly-primary/90 transition-all active:scale-95 shadow-xl shadow-deckly-primary/20"
                >
                  <Plus size={14} />
                  Add Existing
                </button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem] p-16 text-center shadow-inner">
                <FileText
                  size={48}
                  className="text-slate-700 mx-auto mb-6 opacity-30"
                />
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                  No assets identified
                </p>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-8">
                  Populate this room with your best decks
                </p>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-deckly-primary hover:text-deckly-primary/80 transition-colors bg-deckly-primary/10 px-6 py-3 rounded-xl border border-deckly-primary/10"
                >
                  + Select Assets
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, idx) => {
                  const deck = doc.deck;
                  const visitors = visitorsByDeck.get(doc.deck_id) || 0;

                  return (
                    <motion.div
                      key={doc.deck_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group glass-shiny border border-white/5 rounded-2xl p-4 md:p-5 hover:border-deckly-primary/30 hover:shadow-2xl hover:shadow-deckly-primary/5 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-5 relative z-10">
                        {/* Order badge */}
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-16 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-inner group-hover:border-deckly-primary/30 transition-all">
                          {deck?.pages?.[0]?.image_url ? (
                            <img
                              src={deck.pages[0].image_url}
                              alt=""
                              className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText size={16} className="text-slate-700" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-white uppercase tracking-wider truncate group-hover:text-deckly-primary transition-colors">
                            {deck?.title || "Untitled Deck"}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">
                            {deck?.pages?.length || 0} SLIDES IN BUNDLE
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-8 px-6">
                          <div className="text-center">
                            <p className="text-lg font-black text-deckly-primary leading-none">
                              {visitors}
                            </p>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1.5">
                              Readers
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                          {deck && (
                            <Link
                              to={`/analytics/${deck.id}`}
                              className="p-3 text-slate-400 hover:text-deckly-primary bg-white/5 hover:bg-deckly-primary/10 border border-white/10 hover:border-deckly-primary/20 rounded-xl transition-all"
                              title="View Analytics"
                            >
                              <BarChart3 size={14} />
                            </Link>
                          )}
                          <a
                            href={deck ? `/${deck.slug}` : "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                            title="Direct Access"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={() => handleRemoveDocument(doc.deck_id)}
                            disabled={deletingDoc === doc.deck_id}
                            className="p-3 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl transition-all disabled:opacity-30"
                            title="Remove from room"
                          >
                            {deletingDoc === doc.deck_id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <X size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Analytics Per Deck ── */}
          {analytics.perDeck.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={16} className="text-deckly-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Analytics Overview
                </h2>
              </div>

              <div className="glass-shiny border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 px-6 py-4 bg-white/5 border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <div className="col-span-6">ASSET IDENTITY</div>
                  <div className="col-span-3 text-right">ENGAGEMENT</div>
                  <div className="col-span-3 text-right">DISTRIBUTION</div>
                </div>
                {analytics.perDeck.map((item, idx) => {
                  const pct =
                    analytics.totalVisitors > 0
                      ? Math.round(
                          (item.visitors / analytics.totalVisitors) * 100,
                        )
                      : 0;

                  return (
                    <div
                      key={item.deckId}
                      className={`grid grid-cols-12 px-6 py-5 items-center ${
                        idx < analytics.perDeck.length - 1
                          ? "border-b border-white/5"
                          : ""
                      } hover:bg-white/[0.04] transition-colors group`}
                    >
                      <div className="col-span-6 flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-deckly-primary/10 flex items-center justify-center text-[10px] font-black text-deckly-primary shrink-0 border border-deckly-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                          {idx + 1}
                        </div>
                        <p className="text-[13px] text-white font-black uppercase tracking-wider truncate group-hover:text-deckly-primary transition-colors">
                          {item.title}
                        </p>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-base font-black text-deckly-primary">
                          {item.visitors}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-3 group/share relative">
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <div
                            className="h-full bg-deckly-primary rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 w-10 text-right uppercase tracking-widest">
                          {pct}%
                        </span>

                        {/* Tooltip */}
                        <div
                          className={`absolute ${idx === 0 ? "top-full mt-3" : "bottom-full mb-3"} right-0 w-56 p-4 bg-slate-950/90 backdrop-blur-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-2xl opacity-0 group-hover/share:opacity-100 transition-all duration-300 pointer-events-none z-50 text-center leading-relaxed shadow-2xl scale-95 group-hover/share:scale-100`}
                        >
                          Performance relative to total room traffic.
                          <div
                            className={`absolute ${idx === 0 ? "bottom-full border-b-slate-950/90" : "top-full border-t-slate-950/90"} right-6 border-8 border-transparent`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Room Settings Summary ── */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Pencil size={16} className="text-deckly-primary" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Room Settings
              </h2>
            </div>

            <div className="glass-shiny border border-white/5 rounded-[2rem] p-8 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SettingPill
                  label="Leads Capture"
                  value={room.require_email ? "FORCED" : "BYPASS"}
                  active={!!room.require_email}
                />
                <SettingPill
                  label="Elite Access"
                  value={room.require_password ? "GATED" : "OPEN"}
                  active={!!room.require_password}
                />
                <SettingPill
                  label="Life Span"
                  value={
                    room.expires_at ? formatDate(room.expires_at) : "INFINITE"
                  }
                  active={!!room.expires_at}
                />
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => navigate(`/rooms/${roomId}/edit`)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-deckly-primary hover:text-white transition-colors flex items-center gap-2"
                >
                  <Pencil size={12} />
                  Adjust Security
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Delete Data Room?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                This will permanently delete <strong>{room.name}</strong>. Your
                decks will remain intact.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoom}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Picker Modal */}
      <DocumentPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddDocuments}
        excludeDeckIds={documents.map((d) => d.deck_id)}
      />
    </DashboardLayout>
  );
}

export default DataRoomDetail;

/* ─────────── Sub-components ─────────── */

function StatItem({
  icon,
  label,
  value,
  isText = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isText?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 gap-2">
      <div className="text-slate-500 group-hover:text-deckly-primary transition-colors">
        {icon}
      </div>
      <p
        className={`font-black tracking-tighter transition-all ${
          isText
            ? "text-[11px] uppercase tracking-widest text-slate-400 truncate max-w-[140px]"
            : "text-4xl text-white shadow-premium"
        }`}
      >
        {value}
      </p>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500/80">
        {label}
      </p>
    </div>
  );
}

function SettingPill({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
        active
          ? "bg-deckly-primary/10 border-deckly-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.05)]"
          : "bg-white/[0.02] border-white/10"
      }`}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </span>
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${
          active ? "text-deckly-primary" : "text-slate-600"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
