import React, { useState, useRef } from "react";
import {
  Trash2,
  Save,
  Lock,
  Eye,
  EyeOff,
  Upload,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import { deckService } from "../../services/deckService";
import { supabase } from "../../services/supabase";
import { Deck } from "../../types";
import { cn } from "../../utils/cn";

// Shadcn UI Components
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface DeckSettingsFormProps {
  deck: Deck;
  onUpdate: (updatedDeck: Deck) => void;
  onDelete: (deckId: string) => void;
}

export function DeckSettingsForm({
  deck,
  onUpdate,
  onDelete,
}: DeckSettingsFormProps) {
  const [title, setTitle] = useState(deck.title);
  const [slug, setSlug] = useState(deck.slug);
  const [expiryEnabled, setExpiryEnabled] = useState(!!deck.expires_at);
  const [expiryDate, setExpiryDate] = useState(
    deck.expires_at ? deck.expires_at.split("T")[0] : "",
  );
  const [requireEmail, setRequireEmail] = useState(deck.require_email || false);
  const [requirePassword, setRequirePassword] = useState(
    deck.require_password || false,
  );
  const [viewPassword, setViewPassword] = useState(deck.view_password || "");
  const [showPasswordField, setShowPasswordField] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processPdfToImages = async (pdfFile: File) => {
    setUploadProgress("Processing PDF slides...");
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const imageBlobs: Blob[] = [];

    for (let i = 1; i <= numPages; i++) {
      setUploadProgress(`Optimizing slide ${i} of ${numPages}...`);
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

  const handleSave = async () => {
    console.log("Saving deck settings...", {
      title,
      slug,
      requireEmail,
      requirePassword,
    });
    setIsSaving(true);
    setUploadProgress("Syncing changes...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");
      const userId = session.user.id;

      let finalFileUrl = deck.file_url;
      let finalPages = deck.pages;
      let fileSize = deck.file_size;

      if (newFile) {
        setUploadProgress("Uploading new PDF source...");
        const fileExt = newFile.name.split(".").pop();
        const fileName = `${userId}/decks/${slug}-${Date.now()}.${fileExt}`;
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

      const updates: any = {
        title,
        slug,
        file_url: finalFileUrl,
        pages: finalPages,
        file_size: fileSize,
        require_email: requireEmail,
        require_password: requirePassword,
        view_password: viewPassword,
      };

      if (expiryEnabled && expiryDate) {
        updates.expires_at = new Date(expiryDate).toISOString();
      } else {
        updates.expires_at = null;
      }

      const updated = await deckService.updateDeck(deck.id, updates, userId);
      console.log("Deck updated successfully:", updated);
      onUpdate(updated);
      setUploadProgress("Changes Synced!");
      setTimeout(() => setUploadProgress(""), 2000);
      setNewFile(null);
    } catch (err: any) {
      console.error("Failed to sync:", err);
      alert(err.message || "Failed to update deck settings");
      setUploadProgress("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setNewFile(file);
    } else if (file) {
      alert("Please select a valid PDF file.");
    }
  };

  const handleDelete = () => {
    console.log("Handling delete for deck:", deck.id);
    if (
      window.confirm(
        "Are you sure you want to delete this asset? This cannot be undone.",
      )
    ) {
      onDelete(deck.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Basic Management */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-deckly-primary flex items-center gap-2">
              <FileText size={12} strokeWidth={3} />
              Asset Management
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }}
            disabled={isSaving}
            className="rounded-xl px-6 font-bold uppercase tracking-widest text-[10px] bg-deckly-primary text-slate-950 hover:bg-deckly-primary/90 border-none shadow-none z-10"
          >
            {isSaving ? (
              <div className="w-3 h-3 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin mr-2" />
            ) : (
              <Save size={14} className="mr-2" />
            )}
            {isSaving ? "Syncing..." : "Sync Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-slate-900 font-bold ml-1">
              Asset Title
            </Label>
            <Input
              id="title"
              placeholder="Series A Pitch Deck"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900 h-11 rounded-xl focus-visible:ring-deckly-primary/20"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="slug" className="text-slate-900 font-bold ml-1">
              Access Slug
            </Label>
            <Input
              id="slug"
              placeholder="series-a"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900 h-11 rounded-xl focus-visible:ring-deckly-primary/20"
            />
            {slug !== deck.slug && (
              <div className="flex items-center gap-2 px-1 text-red-600">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase tracking-tight">
                  Warning: Breaking Change! Old links will stop working.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-slate-900 font-bold ml-1">
            Replacement Source
          </Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex items-center justify-between p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 cursor-pointer hover:border-deckly-primary/30 hover:bg-deckly-primary/5 transition-all group",
              newFile ? "border-deckly-primary/50 bg-deckly-primary/5" : "",
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-deckly-primary transition-colors">
                <Upload size={20} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  {newFile ? "New file ready" : "Replace existing PDF document"}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {newFile ? newFile.name : "Optimized for web & analytics"}
                </span>
              </div>
            </div>
            {!newFile && (
              <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-deckly-primary">
                Update
              </span>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept=".pdf"
            onChange={handleFileChange}
          />
        </div>
      </section>

      {/* Security & Access */}
      <section className="space-y-8">
        <div className="flex flex-col gap-1.5 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <Lock size={12} strokeWidth={3} />
            Access Protection
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="require-email"
                  className="text-slate-900 font-bold cursor-pointer"
                >
                  Require Email to View
                </Label>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Capture leads & track users
                </p>
              </div>
              <Switch
                id="require-email"
                checked={requireEmail}
                onCheckedChange={(val) => setRequireEmail(val)}
                className="data-[state=checked]:bg-deckly-primary"
              />
            </div>

            <div className="h-px bg-slate-200/50" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="link-expiry"
                    className="text-slate-900 font-bold cursor-pointer"
                  >
                    Enable Link Expiration
                  </Label>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Set a self-destruct date
                  </p>
                </div>
                <Switch
                  id="link-expiry"
                  checked={expiryEnabled}
                  onCheckedChange={(val) => setExpiryEnabled(val)}
                  className="data-[state=checked]:bg-deckly-primary"
                />
              </div>

              <AnimatePresence>
                {expiryEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2"
                  >
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="bg-white border-slate-200 rounded-xl text-slate-900"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="require-password"
                  className="text-slate-900 font-bold cursor-pointer"
                >
                  Password Protected
                </Label>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Secure with private key
                </p>
              </div>
              <Switch
                id="require-password"
                checked={requirePassword}
                onCheckedChange={(val) => setRequirePassword(val)}
                className="data-[state=checked]:bg-deckly-primary"
              />
            </div>

            <AnimatePresence>
              {requirePassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2"
                >
                  <div className="relative">
                    <Input
                      type={showPasswordField ? "text" : "password"}
                      value={viewPassword}
                      onChange={(e) => setViewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-white border-slate-200 rounded-xl pr-10 text-slate-900 placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordField(!showPasswordField)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showPasswordField ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="pt-12 border-t border-slate-100">
        <div className="p-8 rounded-[32px] bg-red-50 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white text-red-500 flex items-center justify-center shadow-none border border-red-100 shrink-0">
              <Trash2 size={24} />
            </div>
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
                Danger Zone
              </p>
              <p className="text-sm text-slate-900 font-bold">
                Permanently Delete Asset
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                This action is irreversible and removes all data.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete();
            }}
            className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] bg-red-500 hover:bg-red-600 text-white border-none shadow-none"
          >
            Delete Asset
          </Button>
        </div>
      </section>

      {/* Progress Toast */}
      <AnimatePresence>
        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl"
          >
            <div className="w-4 h-4 border-2 border-deckly-primary/30 border-t-deckly-primary rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-deckly-primary">
              {uploadProgress}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
