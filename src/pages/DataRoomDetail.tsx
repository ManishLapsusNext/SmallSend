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
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Glow accents */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-deckly-primary/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/8 rounded-full blur-[100px]" />

          <div className="relative z-10 max-w-5xl mx-auto px-6 pt-6 pb-10">
            {/* Back button */}
            <button
              onClick={() => navigate("/rooms")}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 group transition-colors"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />
              All Rooms
            </button>

            {/* Center content */}
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden mb-5 shadow-2xl shadow-black/40 backdrop-blur-sm">
                {room.icon_url ? (
                  <img
                    src={room.icon_url}
                    alt={room.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Monitor size={32} className="text-slate-500" />
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                {room.name}
              </h1>

              {room.description && (
                <p className="text-slate-400 text-sm max-w-md mb-5 leading-relaxed">
                  {room.description}
                </p>
              )}

              {/* Action pills */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-slate-300 hover:text-white transition-all"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Link
                    </>
                  )}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-slate-300 hover:text-white transition-all"
                >
                  <ExternalLink size={14} />
                  Preview
                </a>
                <button
                  onClick={() => navigate(`/rooms/${roomId}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-slate-300 hover:text-white transition-all"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full text-sm text-red-400 hover:text-red-300 transition-all"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ STATS ROW ═══════════════ */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-0">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
              <StatItem
                icon={<FileText size={16} />}
                label="Documents"
                value={documents.length}
              />
              <StatItem
                icon={<Users size={16} />}
                label="Total Visitors"
                value={analytics.totalVisitors}
              />
              <StatItem
                icon={<Calendar size={16} />}
                label="Created"
                value={formatDate(room.created_at)}
                isText
              />
              <StatItem
                icon={<LinkIcon size={16} />}
                label="Share Link"
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
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-deckly-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Documents
                </h2>
                <span className="ml-1 px-2 py-0.5 bg-deckly-primary/10 text-deckly-primary text-[10px] font-black rounded-full">
                  {documents.length}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate(`/upload?returnToRoom=${roomId}`)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  <Plus size={14} />
                  Upload New
                </button>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-deckly-primary text-slate-900 font-bold text-xs rounded-xl hover:bg-deckly-primary/90 transition-all active:scale-95"
                >
                  <Plus size={14} />
                  Add Existing
                </button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 mb-1">
                  No documents yet
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Add your first deck to this data room
                </p>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="text-xs font-bold text-deckly-primary hover:underline"
                >
                  + Add Documents
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, idx) => {
                  const deck = doc.deck;
                  const visitors = visitorsByDeck.get(doc.deck_id) || 0;

                  return (
                    <motion.div
                      key={doc.deck_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group bg-white border border-slate-200 rounded-2xl p-4 hover:border-deckly-primary/30 hover:shadow-lg hover:shadow-deckly-primary/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Order badge */}
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                          {idx + 1}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-14 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {deck?.pages?.[0]?.image_url ? (
                            <img
                              src={deck.pages[0].image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText size={14} className="text-slate-300" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-deckly-primary transition-colors">
                            {deck?.title || "Untitled Deck"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {deck?.pages?.length || 0} pages
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-5">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">
                              {visitors}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                              Visitors
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {deck && (
                            <Link
                              to={`/analytics/${deck.id}`}
                              className="p-2 text-slate-400 hover:text-deckly-primary hover:bg-deckly-primary/5 rounded-lg transition-colors"
                              title="View Analytics"
                            >
                              <BarChart3 size={15} />
                            </Link>
                          )}
                          <a
                            href={deck ? `/${deck.slug}` : "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-deckly-primary hover:bg-deckly-primary/5 rounded-lg transition-colors"
                            title="Preview Deck"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            onClick={() => handleRemoveDocument(doc.deck_id)}
                            disabled={deletingDoc === doc.deck_id}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Remove from room"
                          >
                            {deletingDoc === doc.deck_id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <X size={15} />
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

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <div className="col-span-6">Document</div>
                  <div className="col-span-3 text-right">Visitors</div>
                  <div className="col-span-3 text-right">Share</div>
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
                      className={`grid grid-cols-12 px-5 py-3.5 items-center ${
                        idx < analytics.perDeck.length - 1
                          ? "border-b border-slate-50"
                          : ""
                      } hover:bg-slate-50/50 transition-colors`}
                    >
                      <div className="col-span-6 flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-deckly-primary/10 flex items-center justify-center text-[10px] font-black text-deckly-primary shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-slate-700 font-medium truncate">
                          {item.title}
                        </p>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-sm font-bold text-slate-800">
                          {item.visitors}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-2 group/share relative">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-deckly-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-8 text-right">
                          {pct}%
                        </span>

                        {/* Tooltip */}
                        <div
                          className={`absolute ${idx === 0 ? "top-full mt-2" : "bottom-full mb-2"} right-0 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 group-hover/share:opacity-100 transition-opacity pointer-events-none z-50 text-center font-medium leading-tight shadow-xl`}
                        >
                          Percentage of total room visitors who viewed this
                          specific document.
                          <div
                            className={`absolute ${idx === 0 ? "bottom-full border-b-slate-900" : "top-full border-t-slate-900"} right-4 border-8 border-transparent`}
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

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SettingPill
                  label="Email Capture"
                  value={room.require_email ? "Enabled" : "Disabled"}
                  active={!!room.require_email}
                />
                <SettingPill
                  label="Password"
                  value={room.require_password ? "Enabled" : "Disabled"}
                  active={!!room.require_password}
                />
                <SettingPill
                  label="Expiry"
                  value={
                    room.expires_at ? formatDate(room.expires_at) : "No expiry"
                  }
                  active={!!room.expires_at}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => navigate(`/rooms/${roomId}/edit`)}
                  className="text-xs font-bold text-deckly-primary hover:underline flex items-center gap-1"
                >
                  <Pencil size={12} />
                  Edit Settings
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
    <div className="flex flex-col items-center justify-center py-5 px-3 gap-1">
      <div className="text-slate-400 mb-1">{icon}</div>
      <p
        className={`font-bold tracking-tight ${
          isText
            ? "text-sm text-slate-600 truncate max-w-[140px]"
            : "text-2xl text-deckly-primary"
        }`}
      >
        {value}
      </p>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
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
      className={`flex items-center justify-between p-3 rounded-xl border ${
        active
          ? "bg-deckly-primary/5 border-deckly-primary/20"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span
        className={`text-xs font-bold ${
          active ? "text-deckly-primary" : "text-slate-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
