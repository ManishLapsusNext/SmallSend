import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  HardDrive,
  Upload,
  AlertTriangle,
  Eye,
  Clock,
} from "lucide-react";
import { deckService } from "../services/deckService";
import { analyticsService } from "../services/analyticsService";
import { supabase } from "../services/supabase";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function DeckDetailPanel({
  deck,
  onClose,
  onDelete,
  onShowAnalytics,
  onUpdate,
}) {
  const [editValues, setEditValues] = useState({
    title: "",
    slug: "",
  });
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [summaryStats, setSummaryStats] = useState({ views: 0, avgTime: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef(null);
  const [newFile, setNewFile] = useState(null);

  useEffect(() => {
    if (deck) {
      setEditValues({
        title: deck.title,
        slug: deck.slug,
      });
      setExpiryEnabled(!!deck.expires_at);
      setExpiryDate(deck.expires_at ? deck.expires_at.split("T")[0] : "");
      loadStats(deck.id);
      setNewFile(null);
      setUploadProgress("");
    }
  }, [deck]);

  const loadStats = async (deckId) => {
    try {
      const pageStats = await analyticsService.getDeckStats(deckId);
      if (pageStats && pageStats.length > 0) {
        const totalViews = pageStats.reduce((sum, s) => sum + s.total_views, 0);
        const totalTime = pageStats.reduce(
          (sum, s) => sum + s.total_time_seconds,
          0,
        );
        const avgTime = totalViews > 0 ? totalTime / totalViews : 0;
        setSummaryStats({ views: totalViews, avgTime });
      }
    } catch (err) {
      console.error("Error loading summary stats:", err);
    }
  };

  const processPdfToImages = async (pdfFile) => {
    setUploadProgress("Processing PDF...");
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const imageBlobs = [];

    for (let i = 1; i <= numPages; i++) {
      setUploadProgress(`Processing slide ${i} of ${numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.8),
      );
      imageBlobs.push(blob);
    }
    return imageBlobs;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress("Saving changes...");
    try {
      let finalFileUrl = deck.file_url;
      let finalPages = deck.pages;
      let fileSize = deck.file_size;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const userId = session.user.id;

      // 1. Handle File Replacement if needed
      if (newFile) {
        setUploadProgress("Uploading new PDF...");
        const fileExt = newFile.name.split(".").pop();
        const fileName = `${userId}/decks/${editValues.slug}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("decks")
          .upload(fileName, newFile);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("decks").getPublicUrl(fileName);
        finalFileUrl = publicUrl;
        fileSize = newFile.size;

        const imageBlobs = await processPdfToImages(newFile);
        setUploadProgress(`Uploading ${imageBlobs.length} new slides...`);
        finalPages = await deckService.uploadSlideImages(
          userId,
          editValues.slug,
          imageBlobs,
        );
      }

      // 2. Update Database Record
      const updates = {
        title: editValues.title,
        slug: editValues.slug,
        file_url: finalFileUrl,
        pages: finalPages,
        file_size: fileSize,
        expires_at: expiryEnabled ? new Date(expiryDate).toISOString() : null,
      };

      const updated = await deckService.updateDeck(deck.id, updates);
      onUpdate(updated);
      setUploadProgress("Saved!");
      setTimeout(() => {
        onClose();
        setUploadProgress("");
      }, 1000);
    } catch (err) {
      alert("Failed to update deck: " + err.message);
      setUploadProgress("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setNewFile(file);
    } else if (file) {
      alert("Please select a valid PDF file.");
    }
  };

  if (!deck) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024 || 0).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="side-panel">
        <header className="panel-header">
          <button className="close-panel-btn" onClick={onClose}>
            <X size={24} />
          </button>
          <h2>DECK DETAILS</h2>
        </header>

        <div className="panel-content">
          <div className="panel-preview">
            {deck.pages && deck.pages.length > 0 ? (
              <img
                src={deck.pages[0]}
                alt={deck.title}
                className="panel-thumbnail"
              />
            ) : (
              <div className="panel-thumbnail-placeholder">No Preview</div>
            )}
          </div>

          <div className="panel-title-row">
            <h1>{deck.title}</h1>
            <div className="panel-meta-info">
              <span>
                <Calendar size={14} /> Created {formatDate(deck.created_at)}
              </span>
              <span>
                <HardDrive size={14} /> {formatSize(deck.file_size)}
              </span>
            </div>
          </div>

          <div className="mockup-form">
            <div className="form-field-modern">
              <input
                type="text"
                placeholder="Rename"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues({ ...editValues, title: e.target.value })
                }
              />
            </div>

            <div className="form-field-modern">
              <label
                className="replace-file-label"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} style={{ marginRight: "10px" }} />
                <span>
                  {newFile
                    ? `Replace: ${newFile.name}`
                    : "Replace File (Upload new File)"}
                </span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>

            <div className="form-field-modern">
              <input
                type="text"
                placeholder="Replace Link"
                value={editValues.slug}
                onChange={(e) =>
                  setEditValues({ ...editValues, slug: e.target.value })
                }
              />
            </div>
            {editValues.slug !== deck.slug && (
              <div
                className="slug-warning"
                style={{
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  marginTop: "-0.5rem",
                }}
              >
                <AlertTriangle size={14} /> Breaking change: existing links will
                fail!
              </div>
            )}

            <div className="form-field-modern">
              <div className="form-row-between">
                <span>Link Expiry</span>
                <div
                  className={`toggle-container ${expiryEnabled ? "on" : "off"}`}
                  onClick={() => setExpiryEnabled(!expiryEnabled)}
                >
                  <div className="toggle-knob"></div>
                </div>
              </div>
            </div>

            {expiryEnabled && (
              <div className="form-field-modern">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            )}

            <div className="analytics-section">
              <h3>Analytics</h3>
              <div className="analytics-summary-grid">
                <div className="analytics-summary-card">
                  <div className="analytics-card-icon eye">
                    <Eye size={20} />
                  </div>
                  <div className="analytics-card-info">
                    <div className="analytics-card-label">Total Views</div>
                    <div className="analytics-card-value">
                      {summaryStats.views}
                    </div>
                  </div>
                </div>

                <div className="analytics-summary-card">
                  <div className="analytics-card-icon clock">
                    <Clock size={20} />
                  </div>
                  <div className="analytics-card-info">
                    <div className="analytics-card-label">Avg. Session</div>
                    <div className="analytics-card-value">
                      {Math.round(summaryStats.avgTime)}s
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-details-wrapper">
                <button
                  className="analytics-details-btn-modern"
                  onClick={() => onShowAnalytics(deck)}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-bottom-actions">
          <button
            className="btn-large btn-delete-large"
            onClick={() => onDelete(deck)}
            disabled={isSaving}
          >
            DELETE
          </button>
          <button
            className="btn-large btn-save-large"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? uploadProgress || "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>
    </>
  );
}

export default DeckDetailPanel;
