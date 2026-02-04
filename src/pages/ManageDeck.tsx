import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { deckService } from "../services/deckService";
import { supabase } from "../services/supabase";
import { Upload, X, ArrowLeft, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { Deck, SlidePage } from "../types";

// Common Components
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Card from "../components/common/Card";
import Textarea from "../components/common/Textarea";

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function ManageDeck() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [existingDeck, setExistingDeck] = useState<Deck | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editId) {
      loadExistingDeck(editId);
    }
  }, [editId]);

  const loadExistingDeck = async (id: string) => {
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
    } catch (err: any) {
      console.error("Error loading deck:", err);
      setError("Failed to load deck for editing.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
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
    } else if (selectedFile) {
      alert("Please select a valid PDF file.");
    }
  };

  const processPdfToImages = async (pdfFile: File) => {
    setProgress("Loading PDF for processing...");
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const imageBlobs: Blob[] = [];

    for (let i = 1; i <= numPages; i++) {
      setProgress(`Processing page ${i} of ${numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await (page as any).render({ canvasContext: context, viewport }).promise;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.8),
      );
      if (blob) imageBlobs.push(blob);
    }

    return imageBlobs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!file && !editId) || !title || !slug) return;

    setLoading(true);
    setError(null);

    try {
      let finalFileUrl = existingDeck?.file_url;
      let finalPages: SlidePage[] = existingDeck?.pages || [];

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const userId = session.user.id;

      if (file) {
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

        const imageBlobs = await processPdfToImages(file);
        setProgress(`Uploading ${imageBlobs.length} new slides...`);
        const imageUrls = await deckService.uploadSlideImages(
          userId,
          slug,
          imageBlobs,
        );
        finalPages = imageUrls.map((url, idx) => ({
          image_url: url,
          page_number: idx + 1,
        }));
      }

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
            file_size: file ? file.size : existingDeck?.file_size,
          })
          .eq("id", editId);
        if (dbError) throw dbError;
      } else {
        setProgress("Creating new deck...");
        const deckRecord = await deckService.uploadDeck(file as File, {
          title,
          slug,
          description,
          display_order: 1,
          user_id: userId,
          file_size: file?.size || 0,
        });

        const imageBlobs = await processPdfToImages(file as File);
        setProgress(`Uploading ${imageBlobs.length} slides...`);
        const imageUrls = await deckService.uploadSlideImages(
          userId,
          slug,
          imageBlobs,
        );

        const pages: SlidePage[] = imageUrls.map((url, idx) => ({
          image_url: url,
          page_number: idx + 1,
        }));

        setProgress("Finalizing...");
        await deckService.updateDeckPages(deckRecord.id, pages);
      }

      setProgress("Success! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      console.error("Operation failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <header className="hero-section hero-section-manage">
        <div className="hero-content">
          <h1>{editId ? "Update Deck" : "Upload New Deck"}</h1>
        </div>
      </header>

      <main
        className="home-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: "4rem",
        }}
      >
        <Card
          className="manage-deck-content manage-card-premium"
          style={{
            width: "100%",
            maxWidth: "640px",
            padding: "3.5rem",
            marginTop: "-4rem",
            position: "relative",
            zIndex: 10,
            borderRadius: "32px",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            <Input
              label="Deck Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Q4 Investor Update"
              icon={FileText}
            />

            <Input
              label="Slug (URL Identifier)"
              value={slug}
              onChange={(e) => !editId && setSlug(e.target.value)}
              required
              placeholder="e.g. q4-update"
              disabled={!!editId}
              error={
                editId ? "Slug is permanent to preserve existing links." : null
              }
            />

            <Textarea
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the deck's content..."
              rows={3}
            />

            <div className="form-field-wrapper">
              <label className="form-field-label">
                {editId ? "Replace PDF (Optional)" : "PDF File"}
              </label>
              <Input
                readOnly
                placeholder={
                  editId
                    ? "Leave empty to keep current file"
                    : "Select PDF file..."
                }
                value={file ? file.name : ""}
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>

            {loading && (
              <div className="progress-status-container">
                <div className="spinner-small"></div>
                <p
                  style={{
                    color: "var(--accent-primary)",
                    fontWeight: "600",
                    margin: 0,
                  }}
                >
                  {progress}
                </p>
              </div>
            )}

            {error && (
              <div
                style={{
                  color: "#ef4444",
                  padding: "1.25rem",
                  background: "rgba(239,68,68,0.08)",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <X size={18} />
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                marginTop: "1rem",
              }}
            >
              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
                className="btn-glow-primary"
              >
                {loading
                  ? progress || "Processing..."
                  : editId
                    ? "Save Changes"
                    : "Upload & Process Deck"}
              </Button>

              <Link to="/" style={{ textDecoration: "none" }}>
                <Button variant="ghost" fullWidth icon={ArrowLeft}>
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

export default ManageDeck;
