import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { deckService } from "../services/deckService";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function Admin() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      // Generate slug from filename if empty
      if (!slug) {
        const generatedSlug = selectedFile.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        setSlug(generatedSlug);
      }
      if (!title) {
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
      const viewport = page.getViewport({ scale: 2 }); // High res

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      imageBlobs.push(blob);
    }

    return imageBlobs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !slug) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Upload PDF and create initial record
      setProgress("Uploading PDF...");
      const deckRecord = await deckService.uploadDeck(file, {
        title,
        slug,
        description,
        display_order: 1, // Default
      });

      // 2. Process PDF to images client-side
      const imageBlobs = await processPdfToImages(file);

      // 3. Upload images
      setProgress(`Uploading ${imageBlobs.length} images...`);
      const imageUrls = await deckService.uploadSlideImages(slug, imageBlobs);

      // 4. Update deck record with image URLs
      setProgress("Finalizing deck...");
      await deckService.updateDeckPages(deckRecord.id, imageUrls);

      setProgress("Success!");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <header className="hero-section">
          <h1>Upload New Deck</h1>
        </header>

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
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="e.g. q4-update"
              />
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
              <label>PDF File</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
              </div>
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
                {loading ? "Processing..." : "Upload & Process Deck"}
              </button>
              <Link to="/" className="cancel-link">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

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
