import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { deckService } from "../services/deckService";
import { supabase } from "../services/supabase";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function Admin() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [existingDeck, setExistingDeck] = useState(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (editId) {
      loadExistingDeck(editId);
    }
  }, [editId]);

  const loadExistingDeck = async (id) => {
    try {
      setLoading(true);
      setProgress("Loading deck data...");
      const deck = await deckService.getDeckById(id);
      if (deck) {
        setExistingDeck(deck);
        setTitle(deck.title);
        setSlug(deck.slug);
        setDescription(deck.description || "");
      }
    } catch (err) {
      console.error("Error loading deck:", err);
      setError("Failed to load deck for editing.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      // Generate slug from filename if empty and not editing
      if (!slug && !editId) {
        const generatedSlug = selectedFile.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        setSlug(generatedSlug);
      }
      if (!title && !editId) {
        setTitle(selectedFile.name.replace(".pdf", ""));
      }
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  const processPdfToImages = async (pdfFile) => {
    setProgress("Loading PDF for processing...");
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const imageBlobs = [];

    for (let i = 1; i <= numPages; i++) {
      setProgress(`Processing page ${i} of ${numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 }); // Balanced resolution

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!file && !editId) || !title || !slug) return;

    setLoading(true);
    setError(null);

    try {
      let finalFileUrl = existingDeck?.file_url;
      let finalPages = existingDeck?.pages || [];

      // 1. If a new file is uploaded
      if (file) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        const userId = session.user.id;

        setProgress("Uploading new PDF...");
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/decks/${slug}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("decks")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("decks").getPublicUrl(fileName);
        finalFileUrl = publicUrl;

        // Clean up old processed images if editing
        if (editId && existingDeck) {
          setProgress("Cleaning up old slides...");
          const { data: files } = await supabase.storage
            .from("decks")
            .list(`${userId}/deck-images/${slug}`);
          if (files && files.length > 0) {
            const filesToDelete = files.map(
              (f) => `${userId}/deck-images/${slug}/${f.name}`,
            );
            await supabase.storage.from("decks").remove(filesToDelete);
          }
        }

        // Process new images
        const imageBlobs = await processPdfToImages(file);
        setProgress(`Uploading ${imageBlobs.length} new slides...`);
        finalPages = await deckService.uploadSlideImages(
          userId,
          slug,
          imageBlobs,
        );
      }

      // 2. Update or Create database record
      if (editId) {
        setProgress("Updating deck record...");
        const { error: dbError } = await supabase
          .from("decks")
          .update({
            title,
            description,
            file_url: finalFileUrl,
            pages: finalPages,
            status: "PROCESSED",
            file_size: file ? file.size : existingDeck.file_size,
          })
          .eq("id", editId);
        if (dbError) throw dbError;
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session.user.id;

        setProgress("Creating new deck...");
        const deckRecord = await deckService.uploadDeck(file, {
          title,
          slug,
          description,
          display_order: 1,
          user_id: userId,
          file_size: file.size, // Capture size from the File object
        });

        const imageBlobs = await processPdfToImages(file);
        setProgress(`Uploading ${imageBlobs.length} slides...`);
        const imageUrls = await deckService.uploadSlideImages(
          userId,
          slug,
          imageBlobs,
        );

        setProgress("Finalizing...");
        await deckService.updateDeckPages(deckRecord.id, imageUrls);
      }

      setProgress("Success!");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error("Operation failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <header className="hero-section">
        <div className="hero-content">
          <h1>{editId ? "Update Deck" : "Upload New Deck"}</h1>
        </div>
      </header>

      <main
        className="home-container"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <div
          className="admin-content"
          style={{ width: "100%", maxWidth: "600px" }}
        >
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Deck Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Q4 Investor Update"
              />
            </div>

            <div className="form-group">
              <label>Slug (URL Identifier)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => !editId && setSlug(e.target.value)}
                required
                placeholder="e.g. q4-update"
                disabled={!!editId}
                style={editId ? { opacity: 0.6, cursor: "not-allowed" } : {}}
              />
              {editId && (
                <p className="help-text">
                  Slug cannot be changed to preserve sharing links.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the deck..."
              />
            </div>

            <div className="form-group">
              <label>{editId ? "Replace PDF (Optional)" : "PDF File"}</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required={!editId}
                />
              </div>
              {editId && (
                <p className="help-text">
                  Leave empty to keep the current deck content.
                </p>
              )}
            </div>

            {loading && (
              <div className="progress-status">
                <div className="spinner"></div>
                <p>{progress}</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : editId
                    ? "Save Changes"
                    : "Upload & Process Deck"}
              </button>
              <Link to="/" className="cancel-link">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .admin-form {
          background: var(--bg-card);
          padding: 2.5rem;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .help-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.4rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 0.8rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: white;
          font-family: inherit;
          transition: var(--transition-smooth);
        }
        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .form-group textarea {
          height: 100px;
          resize: vertical;
        }
        .progress-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0;
          padding: 1rem;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 10px;
          color: var(--accent-hover);
          font-weight: 500;
        }
        .submit-button {
          width: 100%;
          padding: 1rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .submit-button:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-2px);
        }
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .form-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }
        .cancel-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
        }
        .cancel-link:hover {
          color: white;
        }
        .error-message {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

export default Admin;
