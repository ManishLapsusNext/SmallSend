import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Share2, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description:
      "Drop a PDF pitch deck and we'll convert it into a shareable, trackable link.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Share2,
    title: "Share",
    description:
      "Send your unique link to investors. They view it beautifully — no downloads.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Track",
    description:
      "See who viewed, how long they spent, and which slides got the most attention.",
    color: "bg-violet-500/10 text-violet-600",
  },
];

export function EmptyStateOverlay() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="relative">
      {/* Greyed-out dashboard ghost behind */}
      <div
        className="absolute inset-0 blur-[2px] opacity-[0.35] pointer-events-none select-none"
        aria-hidden
      >
        <div className="space-y-12 pb-12">
          {/* Ghost top row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white rounded-[32px] border border-slate-200 h-64" />
            <div className="bg-white rounded-[32px] border border-slate-200 h-64" />
          </div>
          {/* Ghost analytics */}
          <div className="bg-white rounded-[32px] border border-slate-200 h-80" />
        </div>
      </div>

      {/* Overlay content */}
      <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-xl mx-auto"
        >
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-12 text-center space-y-8">
            {/* Welcome */}
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto rounded-2xl bg-deckly-primary/10 flex items-center justify-center mb-4"
              >
                <Sparkles size={28} className="text-deckly-primary" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Hey {firstName} 👋
              </h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your data room is ready. Upload your first deck and start
                tracking investor engagement in real time.
              </p>
            </div>

            {/* 3-Step Journey */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${step.color}`}
                  >
                    <step.icon size={20} />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-slate-900">
                    {step.title}
                  </p>
                  <p className="text-[10px] md:text-[11px] text-slate-400 leading-snug hidden md:block">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Connecting arrows (desktop only) */}
            <div className="hidden md:flex items-center justify-center gap-1 -mt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Step 1
              </span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Step 2
              </span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Step 3
              </span>
            </div>

            {/* CTA */}
            <Link to="/upload">
              <Button className="w-full h-12 rounded-xl bg-deckly-primary hover:bg-deckly-primary/90 text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-deckly-primary/20 transition-all">
                <Upload size={16} className="mr-2" />
                Upload Your First Deck
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
