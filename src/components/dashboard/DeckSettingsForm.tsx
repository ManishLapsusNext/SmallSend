import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import { deckService } from "../../services/deckService";
import { supabase } from "../../services/supabase";
import { Deck } from "../../types";

// Sub-components
import { ManagementSection } from "./form-sections/ManagementSection";
import { AccessProtectionSection } from "./form-sections/AccessProtectionSection";
import { DangerZoneSection } from "./form-sections/DangerZoneSection";

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
  // State
  const [title, setTitle] = useState(deck.title);
  const [slug, setSlug] = useState(deck.slug);
  const [requireEmail, setRequireEmail] = useState(deck.require_email || false);
  const [requirePassword, setRequirePassword] = useState(
    deck.require_password || false,
  );
  const [viewPassword, setViewPassword] = useState(deck.view_password || "");
  const [expiryEnabled, setExpiryEnabled] = useState(!!deck.expires_at);
  const [expiryDate, setExpiryDate] = useState(
    deck.expires_at ? deck.expires_at.split("T")[0] : "",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Processing Logic
  const processPdfToImages = async (pdfFile: File) => {
    setUploadProgress("Processing content...");
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const imageBlobs: Blob[] = [];

    for (let i = 1; i <= numPages; i++) {
      setUploadProgress(`Optimizing ${i}/${numPages}...`);
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

  // Main Save Handler
  const handleSave = async () => {
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
        setUploadProgress("Uploading source...");
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
        setUploadProgress(`Updating ${imageBlobs.length} slides...`);
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
        expires_at:
          expiryEnabled && expiryDate
            ? new Date(expiryDate).toISOString()
            : null,
      };

      const updated = await deckService.updateDeck(deck.id, updates, userId);
      onUpdate(updated);
      setUploadProgress("Changes Synced!");
      setTimeout(() => setUploadProgress(""), 2000);
      setNewFile(null);
    } catch (err: any) {
      console.error("Sync error:", err);
      alert(err.message || "Failed to update asset settings");
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

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ManagementSection
        title={title}
        setTitle={setTitle}
        slug={slug}
        setSlug={setSlug}
        originalSlug={deck.slug}
        onFileClick={() => fileInputRef.current?.click()}
        newFile={newFile}
        isSaving={isSaving}
        handleSave={handleSave}
      />

      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept=".pdf"
        onChange={handleFileChange}
      />

      <AccessProtectionSection
        requireEmail={requireEmail}
        setRequireEmail={setRequireEmail}
        expiryEnabled={expiryEnabled}
        setExpiryEnabled={setExpiryEnabled}
        expiryDate={expiryDate}
        setExpiryDate={setExpiryDate}
        requirePassword={requirePassword}
        setRequirePassword={setRequirePassword}
        viewPassword={viewPassword}
        setViewPassword={setViewPassword}
      />

      <DangerZoneSection onDelete={() => onDelete(deck.id)} />

      {/* Progress Notification */}
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
