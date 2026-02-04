import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { deckService } from "../services/deckService";
import { supabase } from "../services/supabase";
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { Deck, SlidePage } from "../types";
import { cn } from "../utils/cn";

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

      setProgress("Successful! Building your room...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      console.error("Operation failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-deckly-background">
      {/* Decorative header */}
      <div className="relative w-full h-[320px] flex items-center justify-center text-center overflow-hidden border-b border-white/5 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-b from-deckly-primary/10 to-transparent"></div>
        <div className="relative z-10 w-full max-w-4xl px-4 -mt-10">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tighter"
          >
            {editId ? "Refine Deck" : "Add Asset"}
          </motion.h1>
          <p className="mt-2 text-slate-400 font-medium">
            {editId
              ? "Update your pitch deck and slides"
              : "Upload a new PDF to your data room"}
          </p>
        </div>
      </div>

      <main className="max-w-3xl w-full mx-auto px-6 -mt-24 pb-24 relative z-20">
        <Card
          variant="glass"
          hoverable={false}
          className="p-8 md:p-12 rounded-[40px] shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="space-y-6">
              <Input
                label="Asset Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Series A Pitch Deck - v2"
                icon={FileText}
              />

              <Input
                label="URL Slug"
                value={slug}
                onChange={(e) => !editId && setSlug(e.target.value)}
                required
                placeholder="e.g. series-a-v2"
                disabled={!!editId}
                error={
                  editId
                    ? "Links are permanent to prevent broken access."
                    : null
                }
              />

              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly explain what this document contains..."
                rows={3}
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400 px-1">
                  {editId ? "Replace Document" : "PDF Document"}
                </label>
                <div
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className={cn(
                    "relative group cursor-pointer border-2 border-dashed border-white/10 rounded-2xl p-8 text-center transition-all hover:border-deckly-primary/50 hover:bg-white/5",
                    file ? "border-deckly-primary/30 bg-deckly-primary/5" : "",
                    loading ? "opacity-50 cursor-not-allowed" : "",
                  )}
                >
                  <div className="flex flex-col items-center gap-3">
                    {file ? (
                      <CheckCircle2 size={32} className="text-deckly-primary" />
                    ) : (
                      <Upload
                        size={32}
                        className="text-slate-500 group-hover:text-deckly-primary transition-colors"
                      />
                    )}
                    <div>
                      <p className="text-white font-bold">
                        {file ? file.name : "Select PDF File"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Maximum file size: 50MB
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center justify-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5"
                >
                  <div className="w-5 h-5 border-2 border-deckly-primary/30 border-t-deckly-primary rounded-full animate-spin" />
                  <span className="text-sm font-bold text-deckly-primary uppercase tracking-widest">
                    {progress}
                  </span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-500"
                >
                  <AlertCircle size={20} />
                  <span className="text-sm font-bold">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                size="large"
                fullWidth
                loading={loading}
                className="shadow-2xl shadow-deckly-primary/20"
              >
                {editId ? "Update Asset" : "Publish to Data Room"}
              </Button>

              <Link to="/">
                <Button variant="ghost" fullWidth icon={ArrowLeft}>
                  Discard Changes
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
