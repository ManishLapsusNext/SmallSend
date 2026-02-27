import { useState, useRef } from "react";
import { X, Upload, Trash2, Camera, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandingSettings } from "../../types";
import { deckService } from "../../services/deckService";
import penguinMascot from "../../assets/penguine.png";

interface MascotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: BrandingSettings | null;
  onUpdate: (newBranding: BrandingSettings) => void;
}

export function MascotSettingsModal({
  isOpen,
  onClose,
  branding,
  onUpdate,
}: MascotSettingsModalProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLogo = branding?.logo_url || penguinMascot;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const publicUrl = await deckService.uploadLogo(file);

      const updated = await deckService.updateBrandingSettings({
        logo_url: publicUrl,
      });

      onUpdate(updated);
    } catch (err: any) {
      console.error("Upload failed", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    setUploading(true);
    try {
      const updated = await deckService.updateBrandingSettings({
        logo_url: null,
      });
      onUpdate(updated);
    } catch (err) {
      setError("Failed to reset logo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Customize Mascot
                </h2>
                <p className="text-xs text-slate-400">
                  Personalize your dashboard branding
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                disabled={uploading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              {/* Preview Area */}
              <div className="flex flex-col items-center">
                <div className="relative group/mascot">
                  <div className="w-40 h-40 bg-slate-800 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={currentLogo}
                      alt="Mascot Preview"
                      className="w-full h-full object-contain"
                    />

                    {uploading && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                        <Loader2
                          size={32}
                          className="text-deckly-primary animate-spin"
                        />
                      </div>
                    )}
                  </div>

                  {!uploading && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-3 -right-3 w-10 h-10 bg-deckly-primary text-slate-950 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-slate-900"
                      title="Upload New"
                    >
                      <Camera size={18} />
                    </button>
                  )}
                </div>

                <div className="mt-8 w-full space-y-4">
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 flex gap-3">
                    <Info
                      size={16}
                      className="text-deckly-primary shrink-0 mt-0.5"
                    />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Your brand mascot will appear at the top of the sidebar.
                      Transparent PNGs work best. Max size 2MB.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl border border-white/10 transition-all disabled:opacity-50"
                    >
                      <Upload size={16} />
                      Upload Logo
                    </button>

                    {branding?.logo_url && (
                      <button
                        onClick={handleReset}
                        disabled={uploading}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all disabled:opacity-50"
                        title="Reset to Default"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center animate-shake">
                  {error}
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
