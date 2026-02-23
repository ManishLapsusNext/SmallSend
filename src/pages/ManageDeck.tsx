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
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { Deck, SlidePage } from "../types";
import { cn } from "@/lib/utils";

// Layout
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DashboardCard } from "../components/ui/DashboardCard";

// shadcn/ui
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";

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
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [viewPassword, setViewPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
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
        setRequireEmail(deck.require_email || false);
        setRequirePassword(deck.require_password || false);
        setViewPassword(deck.view_password || "");
        setExpiresAt(deck.expires_at ? deck.expires_at.split("T")[0] : "");
        setEnableExpiry(!!deck.expires_at);
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
      setProgressPercent(Math.round((i / numPages) * 50));
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
    setProgressPercent(0);

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
        setProgressPercent(5);
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
        setProgress(`Uploading slide 1 of ${imageBlobs.length}...`);
        const imageUrls = await deckService.uploadSlideImages(
          userId,
          slug,
          imageBlobs,
          (current, total) => {
            setProgress(`Uploading slide ${current} of ${total}...`);
            setProgressPercent(50 + Math.round((current / total) * 45));
          },
        );
        finalPages = imageUrls.map((url, idx) => ({
          image_url: url,
          page_number: idx + 1,
        }));
      }

      if (editId) {
        setProgress("Updating deck record...");
        setProgressPercent(95);
        const { error: dbError } = await supabase
          .from("decks")
          .update({
            title,
            description,
            file_url: finalFileUrl,
            pages: finalPages,
            status: "PROCESSED",
            file_size: file ? file.size : existingDeck?.file_size,
            require_email: requireEmail,
            require_password: requirePassword,
            view_password: viewPassword,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          })
          .eq("id", editId);
        if (dbError) throw dbError;
      } else {
        setProgress("Creating new deck...");
        setProgressPercent(95);
        const deckRecord = await deckService.uploadDeck(file as File, {
          title,
          slug,
          description,
          display_order: 1,
          user_id: userId,
          file_size: file?.size || 0,
          require_email: requireEmail,
          require_password: requirePassword,
          view_password: viewPassword,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        });

        const imageBlobs = await processPdfToImages(file as File);
        setProgress(`Uploading slide 1 of ${imageBlobs.length}...`);
        const imageUrls = await deckService.uploadSlideImages(
          userId,
          slug,
          imageBlobs,
          (current, total) => {
            setProgress(`Uploading slide ${current} of ${total}...`);
            setProgressPercent(50 + Math.round((current / total) * 45));
          },
        );

        const pages: SlidePage[] = imageUrls.map((url, idx) => ({
          image_url: url,
          page_number: idx + 1,
        }));

        setProgress("Finalizing...");
        setProgressPercent(98);
        await deckService.updateDeckPages(deckRecord.id, pages);
      }

      setProgress("Successful! Building your room...");
      setProgressPercent(100);
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      console.error("Operation failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title={editId ? "Refine Deck" : "Add New Asset"}>
      <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {editId ? "Refine Deck" : "Add New Asset"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {editId
              ? "Update your pitch deck details and slides"
              : "Upload a PDF to your data room"}
          </p>
        </div>

        {/* Main Form Card */}
        <DashboardCard className="p-6 md:p-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* --- Document Details Section --- */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-deckly-primary" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Document Details
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 font-semibold">
                  Asset Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Series A Pitch Deck - v2"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-deckly-primary text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-slate-700 font-semibold">
                  URL Slug
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => !editId && setSlug(e.target.value)}
                  required
                  placeholder="e.g. series-a-v2"
                  disabled={!!editId}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-deckly-primary text-slate-900 placeholder:text-slate-400"
                />
                {editId && (
                  <p className="text-xs text-slate-400 px-1">
                    Links are permanent to prevent broken access.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-slate-700 font-semibold"
                >
                  Description
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly explain what this document contains..."
                  rows={3}
                  className="flex w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-deckly-primary resize-none"
                />
              </div>
            </div>

            {/* --- PDF Upload Zone --- */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">
                {editId ? "Replace Document" : "PDF Document"}
              </Label>
              <div
                onClick={() => !loading && fileInputRef.current?.click()}
                className={cn(
                  "relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 md:p-10 text-center transition-all",
                  file
                    ? "border-deckly-primary/40 bg-deckly-primary/5"
                    : "border-slate-200 hover:border-deckly-primary/40 hover:bg-slate-50",
                  loading ? "opacity-50 cursor-not-allowed" : "",
                )}
              >
                <div className="flex flex-col items-center gap-3">
                  {file ? (
                    <div className="w-14 h-14 rounded-2xl bg-deckly-primary/10 flex items-center justify-center">
                      <CheckCircle2 size={28} className="text-deckly-primary" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-deckly-primary/10 transition-colors">
                      <Upload
                        size={28}
                        className="text-slate-400 group-hover:text-deckly-primary transition-colors"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {file ? file.name : "Click to select a PDF"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {file
                        ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                        : "Maximum file size: 50MB"}
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

            {/* --- Access Protection Section --- */}
            <div className="pt-4 border-t border-slate-100 space-y-5">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-deckly-primary" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Access Protection
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Require Email */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    requireEmail
                      ? "bg-deckly-primary/5 border-deckly-primary/30"
                      : "bg-slate-50/50 border-slate-200",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Mail
                      size={18}
                      className={
                        requireEmail ? "text-deckly-primary" : "text-slate-400"
                      }
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Require Email
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Capture viewer emails
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={requireEmail}
                    onCheckedChange={setRequireEmail}
                    className="data-[state=checked]:bg-deckly-primary"
                  />
                </div>

                {/* Password Protected */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    requirePassword
                      ? "bg-deckly-primary/5 border-deckly-primary/30"
                      : "bg-slate-50/50 border-slate-200",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Lock
                      size={18}
                      className={
                        requirePassword
                          ? "text-deckly-primary"
                          : "text-slate-400"
                      }
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Password
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Restrict with a password
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={requirePassword}
                    onCheckedChange={setRequirePassword}
                    className="data-[state=checked]:bg-deckly-primary"
                  />
                </div>
              </div>

              <AnimatePresence>
                {requirePassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-slate-700 font-semibold"
                      >
                        Viewing Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPasswordField ? "text" : "password"}
                          value={viewPassword}
                          onChange={(e) => setViewPassword(e.target.value)}
                          placeholder="Create a strong password"
                          required={requirePassword}
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-deckly-primary text-slate-900 placeholder:text-slate-400 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordField(!showPasswordField)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {showPasswordField ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expiry Date Toggle */}
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  enableExpiry
                    ? "bg-deckly-primary/5 border-deckly-primary/30"
                    : "bg-slate-50/50 border-slate-200",
                )}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={18}
                    className={
                      enableExpiry ? "text-deckly-primary" : "text-slate-400"
                    }
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Set Expiry Date
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Auto-disable access after date
                    </p>
                  </div>
                </div>
                <Switch
                  checked={enableExpiry}
                  onCheckedChange={(checked) => {
                    setEnableExpiry(checked);
                    if (!checked) setExpiresAt("");
                  }}
                  className="data-[state=checked]:bg-deckly-primary"
                />
              </div>

              <AnimatePresence>
                {enableExpiry && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="expiry"
                        className="text-slate-700 font-semibold"
                      >
                        Expiry Date
                      </Label>
                      <Input
                        id="expiry"
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-deckly-primary text-slate-900"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* --- Progress & Error --- */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-deckly-primary uppercase tracking-widest">
                      {progress}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {progressPercent}%
                    </span>
                  </div>
                  <Progress
                    value={progressPercent}
                    className="h-2 bg-slate-100 [&>div]:bg-deckly-primary"
                  />
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-200 text-red-600"
                >
                  <AlertCircle size={20} />
                  <span className="text-sm font-bold">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- Actions --- */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-deckly-primary hover:bg-deckly-primary/90 text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-deckly-primary/20 transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    {editId ? "Update Asset" : "Upload"}
                  </div>
                )}
              </Button>

              <Link to="/">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-10 text-slate-400 hover:text-slate-700 font-bold text-xs uppercase tracking-widest"
                >
                  <ArrowLeft size={14} className="mr-2" />
                  Discard Changes
                </Button>
              </Link>
            </div>
          </form>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}

export default ManageDeck;
