import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { Deck } from "../types";
import Button from "./common/Button";
import Input from "./common/Input";

interface AccessGateProps {
  deck: Deck;
  onAccessGranted: (email?: string) => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ deck, onAccessGranted }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "password">(
    deck.require_email ? "email" : "password",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === "email") {
      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      if (deck.require_password) {
        setStep("password");
      } else {
        onAccessGranted(email);
      }
    } else {
      if (password === deck.view_password) {
        onAccessGranted(email);
      } else {
        setError("Incorrect password. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-deckly-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(42,212,133,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(167,139,250,0.05),transparent_40%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-deckly-primary/10 rounded-full blur-[80px] group-hover:bg-deckly-primary/20 transition-all duration-700" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={40} className="text-deckly-primary" />
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight mb-4 leading-tight">
              Access Restricted
            </h2>
            <p className="text-slate-400 font-medium mb-10 leading-relaxed">
              This document is protected. Please provide the required
              information to continue to{" "}
              <span className="text-white font-bold">"{deck.title}"</span>.
            </p>

            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-6 text-left"
            >
              <AnimatePresence mode="wait">
                {step === "email" ? (
                  <motion.div
                    key="email-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Input
                      label="Your Email"
                      type="email"
                      placeholder="name@company.com"
                      icon={Mail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="password-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Input
                      label="Viewing Password"
                      type="password"
                      placeholder="••••••••"
                      icon={Lock}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20 text-xs font-bold"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                size="large"
                fullWidth
                className="mt-4 shadow-xl shadow-deckly-primary/10 py-4 font-black tracking-widest uppercase flex items-center gap-3"
              >
                {step === "email" && deck.require_password
                  ? "Next Step"
                  : "Unlock Deck"}
                <ArrowRight size={18} />
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
          Securely delivered by Deckly &copy; 2026
        </p>
      </motion.div>
    </div>
  );
};

export default AccessGate;
