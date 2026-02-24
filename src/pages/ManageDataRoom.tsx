import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Copy,
  Check,
  Plus,
  Link as LinkIcon,
  Image,
  Loader2,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DocumentPicker } from "../components/dashboard/DocumentPicker";
import { RoomDocumentList } from "../components/dashboard/RoomDocumentList";
import { AccessProtectionSection } from "../components/dashboard/form-sections/AccessProtectionSection";
import { DangerZoneSection } from "../components/dashboard/form-sections/DangerZoneSection";
import { DataRoomDocument } from "../types";
import { dataRoomService } from "../services/dataRoomService";
import { useAuth } from "../contexts/AuthContext";
import { TIER_CONFIG, Tier } from "../constants/tiers";

function ManageDataRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEditMode = !!roomId && roomId !== "new";

  // Tier limit safety check for create mode
  useEffect(() => {
    if (isEditMode) return;
    const tier: Tier = (profile?.tier as Tier) || "FREE";
    const max = TIER_CONFIG[tier].maxDataRooms;
    dataRoomService.getDataRooms().then((rooms) => {
      if (rooms.length >= max) navigate("/rooms");
    });
  }, [isEditMode, profile, navigate]);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState<string>("");
  const [iconPreview, setIconPreview] = useState<string>("");
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [viewPassword, setViewPassword] = useState("");
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");

  // Documents
  const [documents, setDocuments] = useState<DataRoomDocument[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Load existing room data
  useEffect(() => {
    if (!isEditMode) return;

    async function load() {
      setLoading(true);
      try {
        const room = await dataRoomService.getDataRoomById(roomId!);
        if (!room) {
          navigate(isEditMode ? `/rooms/${roomId}` : "/rooms");
          return;
        }
        setName(room.name);
        setSlug(room.slug);
        setDescription(room.description || "");
        setIconUrl(room.icon_url || "");
        setIconPreview(room.icon_url || "");
        setRequireEmail(room.require_email || false);
        setRequirePassword(room.require_password || false);
        setViewPassword(room.view_password || "");
        setExpiryEnabled(!!room.expires_at);
        setExpiryDate(room.expires_at ? room.expires_at.split("T")[0] : "");

        const docs = await dataRoomService.getDocuments(roomId!);
        setDocuments(docs);
      } catch (err) {
        console.error("Failed to load room", err);
        setError("Failed to load data room");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [roomId, isEditMode, navigate]);

  // Auto-generate slug from name (only in create mode)
  useEffect(() => {
    if (!isEditMode && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim(),
      );
    }
  }, [name, isEditMode]);

  // Icon upload handler
  const handleIconUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Preview
      const reader = new FileReader();
      reader.onload = () => setIconPreview(reader.result as string);
      reader.readAsDataURL(file);

      setUploadingIcon(true);
      try {
        const url = await dataRoomService.uploadRoomIcon(file);
        setIconUrl(url);
      } catch (err) {
        console.error("Failed to upload icon", err);
        setError("Failed to upload icon");
      } finally {
        setUploadingIcon(false);
      }
    },
    [],
  );

  // Add documents
  const handleAddDocuments = useCallback(
    async (deckIds: string[]) => {
      if (isEditMode) {
        try {
          await dataRoomService.addDocuments(roomId!, deckIds);
          const docs = await dataRoomService.getDocuments(roomId!);
          setDocuments(docs);
        } catch (err) {
          console.error("Failed to add documents", err);
        }
      } else {
        // In create mode, just track deck IDs locally (documents will be added after creation)
        const fakeDocs = deckIds.map((id, i) => ({
          id: `temp-${id}`,
          data_room_id: "",
          deck_id: id,
          display_order: documents.length + i,
          added_at: new Date().toISOString(),
        })) as DataRoomDocument[];
        setDocuments((prev) => [...prev, ...fakeDocs]);
      }
    },
    [isEditMode, roomId, documents.length],
  );

  // Remove document
  const handleRemoveDocument = useCallback(
    async (deckId: string) => {
      if (isEditMode) {
        try {
          await dataRoomService.removeDocument(roomId!, deckId);
          setDocuments((prev) => prev.filter((d) => d.deck_id !== deckId));
        } catch (err) {
          console.error("Failed to remove document", err);
        }
      } else {
        setDocuments((prev) => prev.filter((d) => d.deck_id !== deckId));
      }
    },
    [isEditMode, roomId],
  );

  // Reorder documents
  const handleReorder = useCallback(
    async (orderedDeckIds: string[]) => {
      // Optimistic reorder
      const reordered = orderedDeckIds.map((id, i) => {
        const doc = documents.find((d) => d.deck_id === id)!;
        return { ...doc, display_order: i };
      });
      setDocuments(reordered);

      if (isEditMode) {
        try {
          await dataRoomService.reorderDocuments(roomId!, orderedDeckIds);
        } catch (err) {
          console.error("Failed to reorder", err);
        }
      }
    },
    [isEditMode, roomId, documents],
  );

  // Save / Create
  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isEditMode) {
        await dataRoomService.updateDataRoom(roomId!, {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          icon_url: iconUrl || undefined,
          require_email: requireEmail,
          require_password: requirePassword,
          view_password: requirePassword ? viewPassword : undefined,
          expires_at:
            expiryEnabled && expiryDate
              ? new Date(expiryDate).toISOString()
              : null,
        });
        navigate(`/rooms/${roomId}`);
      } else {
        // Check slug availability
        const available = await dataRoomService.checkSlugAvailable(slug);
        if (!available) {
          setError("This slug is already taken. Please choose another.");
          setSaving(false);
          return;
        }

        const room = await dataRoomService.createDataRoom({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          icon_url: iconUrl || undefined,
        });

        // Update access settings
        if (requireEmail || requirePassword || expiryEnabled) {
          await dataRoomService.updateDataRoom(room.id, {
            require_email: requireEmail,
            require_password: requirePassword,
            view_password: requirePassword ? viewPassword : undefined,
            expires_at:
              expiryEnabled && expiryDate
                ? new Date(expiryDate).toISOString()
                : null,
          });
        }

        // Add documents
        const deckIds = documents.map((d) => d.deck_id);
        if (deckIds.length > 0) {
          await dataRoomService.addDocuments(room.id, deckIds);
        }

        navigate(`/rooms/${room.id}`);
      }
    } catch (err: any) {
      console.error("Failed to save", err);
      setError(err?.message || "Failed to save data room");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!isEditMode) return;
    try {
      await dataRoomService.deleteDataRoom(roomId!);
      navigate("/rooms");
    } catch (err) {
      console.error("Failed to delete room", err);
    }
  };

  // Copy link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = `${window.location.origin}/room/${slug}`;

  if (loading) {
    return (
      <DashboardLayout title="Data Rooms" showFab={false}>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-deckly-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Data Rooms" showFab={false}>
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isEditMode ? `/rooms/${roomId}` : "/rooms")}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">
            {isEditMode ? "Edit Data Room" : "Create Data Room"}
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ──── Section 1: Room Identity ──── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Room Identity
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Icon */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {iconPreview ? (
                  <>
                    <img
                      src={iconPreview}
                      alt="Room icon"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setIconUrl("");
                        setIconPreview("");
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </>
                ) : uploadingIcon ? (
                  <Loader2 size={20} className="text-slate-400 animate-spin" />
                ) : (
                  <Image size={24} className="text-slate-300" />
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                  <Upload size={14} />
                  {iconPreview ? "Replace Icon" : "Upload Icon"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconUpload}
                  />
                </label>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG, or SVG. Max 1MB.
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Room Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Series A Fundraise"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-deckly-primary/30 focus:border-deckly-primary"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Slug <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <span className="pl-4 pr-1 text-sm text-slate-400 select-none whitespace-nowrap">
                    /room/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-"),
                      )
                    }
                    placeholder="series-a"
                    className="flex-1 py-2.5 pr-4 bg-transparent text-sm text-slate-700 focus:outline-none"
                  />
                </div>
                {slug && (
                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-deckly-primary hover:border-deckly-primary/30 transition-colors"
                    title="Copy share link"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}
              </div>
              {slug && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <LinkIcon size={11} />
                  {shareUrl}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for your data room..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-deckly-primary/30 focus:border-deckly-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* ──── Section 2: Documents ──── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Documents
            </h2>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-deckly-primary/10 text-deckly-primary text-xs font-bold rounded-lg hover:bg-deckly-primary/20 transition-colors"
            >
              <Plus size={14} />
              Add Documents
            </button>
          </div>
          <div className="p-4">
            <RoomDocumentList
              documents={documents}
              onRemove={handleRemoveDocument}
              onReorder={handleReorder}
            />
          </div>
        </div>

        {/* ──── Section 3: Access Controls ──── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Access Controls
            </h2>
          </div>
          <div className="p-6">
            <AccessProtectionSection
              requireEmail={requireEmail}
              setRequireEmail={setRequireEmail}
              requirePassword={requirePassword}
              setRequirePassword={setRequirePassword}
              viewPassword={viewPassword}
              setViewPassword={setViewPassword}
              expiryEnabled={expiryEnabled}
              setExpiryEnabled={setExpiryEnabled}
              expiryDate={expiryDate}
              setExpiryDate={setExpiryDate}
            />
          </div>
        </div>

        {/* ──── Section 4: Danger Zone (edit only) ──── */}
        {isEditMode && (
          <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-red-400">
                Danger Zone
              </h2>
            </div>
            <div className="p-6">
              <DangerZoneSection onDelete={handleDelete} />
            </div>
          </div>
        )}

        {/* ──── Save Button ──── */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !slug.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-deckly-primary text-slate-900 font-bold text-sm rounded-xl hover:bg-deckly-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditMode ? "Save Changes" : "Create Data Room"}
          </button>
        </div>
      </div>

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

export default ManageDataRoom;
