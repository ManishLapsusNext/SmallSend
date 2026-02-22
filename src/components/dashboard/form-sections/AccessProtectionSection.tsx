import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";

interface AccessProtectionSectionProps {
  requireEmail: boolean;
  setRequireEmail: (v: boolean) => void;
  expiryEnabled: boolean;
  setExpiryEnabled: (v: boolean) => void;
  expiryDate: string;
  setExpiryDate: (v: string) => void;
  requirePassword: boolean;
  setRequirePassword: (v: boolean) => void;
  viewPassword: string;
  setViewPassword: (v: string) => void;
}

export function AccessProtectionSection({
  requireEmail,
  setRequireEmail,
  expiryEnabled,
  setExpiryEnabled,
  expiryDate,
  setExpiryDate,
  requirePassword,
  setRequirePassword,
  viewPassword,
  setViewPassword,
}: AccessProtectionSectionProps) {
  const [showPasswordField, setShowPasswordField] = useState(false);

  return (
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
              onCheckedChange={setRequireEmail}
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
                onCheckedChange={setExpiryEnabled}
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
              onCheckedChange={setRequirePassword}
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
  );
}
