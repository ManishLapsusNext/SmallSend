import { useState } from "react";
import { Lock, Eye, EyeOff, Mail, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { cn } from "@/lib/utils";

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
    <section className="space-y-5">
      <div className="flex items-center gap-3 px-1 mb-6">
        <Lock size={16} className="text-deckly-primary" />
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          SECURITY OVERRIDE
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Require Email */}
        <div
          className={cn(
            "flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 group",
            requireEmail
              ? "bg-deckly-primary/10 border-deckly-primary/30 shadow-[0_0_30px_rgba(34,197,94,0.05)]"
              : "bg-white/5 border-white/5 hover:border-white/10",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                requireEmail
                  ? "bg-deckly-primary/20 text-deckly-primary border border-deckly-primary/30"
                  : "bg-white/5 text-slate-700 border border-white/5",
              )}
            >
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-wider">
                LEADS CAPTURE
              </p>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                FORCED EMAIL ENTRY
              </p>
            </div>
          </div>
          <Switch
            id="require-email"
            checked={requireEmail}
            onCheckedChange={setRequireEmail}
            className="data-[state=checked]:bg-deckly-primary scale-110"
          />
        </div>

        {/* Password Protected */}
        <div
          className={cn(
            "flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 group",
            requirePassword
              ? "bg-deckly-primary/10 border-deckly-primary/30 shadow-[0_0_30px_rgba(34,197,94,0.05)]"
              : "bg-white/5 border-white/5 hover:border-white/10",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                requirePassword
                  ? "bg-deckly-primary/20 text-deckly-primary border border-deckly-primary/30"
                  : "bg-white/5 text-slate-700 border border-white/5",
              )}
            >
              <Lock size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-wider">
                ELITE ACCESS
              </p>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                PASSWORD PROTECTION
              </p>
            </div>
          </div>
          <Switch
            id="require-password"
            checked={requirePassword}
            onCheckedChange={setRequirePassword}
            className="data-[state=checked]:bg-deckly-primary scale-110"
          />
        </div>

        {/* Set Expiry Date */}
        <div
          className={cn(
            "flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 group",
            expiryEnabled
              ? "bg-deckly-primary/10 border-deckly-primary/30 shadow-[0_0_30px_rgba(34,197,94,0.05)]"
              : "bg-white/5 border-white/5 hover:border-white/10",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                expiryEnabled
                  ? "bg-deckly-primary/20 text-deckly-primary border border-deckly-primary/30"
                  : "bg-white/5 text-slate-700 border border-white/5",
              )}
            >
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-wider">
                LIFE SPAN
              </p>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                EXPIRATION DATE
              </p>
            </div>
          </div>
          <Switch
            id="link-expiry"
            checked={expiryEnabled}
            onCheckedChange={(checked) => {
              setExpiryEnabled(checked);
              if (!checked) setExpiryDate("");
            }}
            className="data-[state=checked]:bg-deckly-primary scale-110"
          />
        </div>
      </div>

      {/* Password Reveal */}
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
                htmlFor="view-password"
                className="text-slate-700 font-semibold"
              >
                Viewing Password
              </Label>
              <div className="relative">
                <Input
                  id="view-password"
                  type={showPasswordField ? "text" : "password"}
                  value={viewPassword}
                  onChange={(e) => setViewPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-deckly-primary text-slate-900 placeholder:text-slate-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPasswordField ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expiry Date Reveal */}
      <AnimatePresence>
        {expiryEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <Label
                htmlFor="expiry-date"
                className="text-slate-700 font-semibold"
              >
                Expiry Date
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-deckly-primary text-slate-900"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
