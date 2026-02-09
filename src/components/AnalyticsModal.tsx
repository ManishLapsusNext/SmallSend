import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, BarChart3, Clock, Eye, Loader2, Zap, History } from "lucide-react";
import { analyticsService } from "../services/analyticsService";
import { Deck, DeckStats } from "../types";
import { cn } from "../utils/cn";
import { useAuth } from "../contexts/AuthContext";
import { getTierConfig } from "../constants/tiers";
import Button from "./common/Button";
import Card from "./common/Card";

interface AnalyticsModalProps {
  deck: Deck;
  onClose: () => void;
}

function AnalyticsModal({ deck, onClose }: AnalyticsModalProps) {
  const [stats, setStats] = useState<DeckStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"views" | "time">("views");
  const { session, isPro } = useAuth();
  const tier = getTierConfig(!!isPro);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: stop loading after 8 seconds even if request hangs
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        console.warn("Analytics fetch timed out");
      }
    }, 8000);

    const fetchStats = async () => {
      try {
        const userId = session?.user?.id;
        // Optimization: Pass isPro directly from AuthContext to avoid redundant service-side queries
        const data = await analyticsService.getDeckStats(
          deck.id,
          !!isPro,
          userId,
        );
        if (mounted) {
          setStats(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    };
    fetchStats();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [deck.id, session, isPro]);

  const totalViews = stats.reduce((acc, curr) => acc + curr.total_views, 0);
  const totalSeconds = stats.reduce(
    (acc, curr) => acc + curr.total_time_seconds,
    0,
  );
  const avgTimePerView =
    totalViews > 0 ? (totalSeconds / totalViews).toFixed(1) : 0;

  const maxViews = Math.max(...stats.map((s) => s.total_views), 1);
  const maxTime = Math.max(
    ...stats.map((s) => s.total_time_seconds / (s.total_views || 1)),
    1,
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <header className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-deckly-primary/10 text-deckly-primary rounded-2xl flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Deck Insights
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                  <History size={10} className="text-deckly-primary" />
                  {tier.label}
                </div>
              </div>
              <p className="text-sm text-slate-400 font-medium truncate max-w-[240px]">
                {deck.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-deckly-primary" size={32} />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                Analyzing Engagement
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <Card
                  variant="solid"
                  hoverable={false}
                  className="p-5 border-white/10 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-deckly-primary/10 text-deckly-primary rounded-xl flex items-center justify-center">
                      <Eye size={20} />
                    </div>
                    <span className="text-[10px] items uppercase tracking-widest text-slate-500 font-bold">
                      Total Views
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white leading-none">
                    {totalViews}
                  </div>
                </Card>

                <Card
                  variant="solid"
                  hoverable={false}
                  className="p-5 border-white/10 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-deckly-secondary/10 text-deckly-secondary rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <span className="text-[10px] items uppercase tracking-widest text-slate-500 font-bold">
                      Avg. Session
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white leading-none">
                    {avgTimePerView}s
                  </div>
                </Card>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Engagement per Slide
                  </h4>
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    {(["views", "time"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                          activeTab === tab
                            ? "bg-slate-800 text-white shadow-lg"
                            : "text-slate-500 hover:text-slate-300",
                        )}
                      >
                        {tab === "views" ? "Views" : "Time"}
                      </button>
                    ))}
                  </div>
                </div>

                {stats.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 italic text-sm font-medium">
                    No activity recorded yet for this deck.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.map((s) => {
                      const avgTime =
                        s.total_views > 0
                          ? s.total_time_seconds / s.total_views
                          : 0;
                      const viewPercent = (s.total_views / maxViews) * 100;
                      const timePercent = (avgTime / maxTime) * 100;
                      const percentage =
                        activeTab === "views" ? viewPercent : timePercent;

                      return (
                        <div
                          key={s.page_number}
                          className="flex items-center gap-4"
                        >
                          <span className="text-[10px] font-black text-slate-600 w-8">
                            Pg {s.page_number}
                          </span>
                          <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, ease: "circOut" }}
                              className={cn(
                                "h-full flex items-center justify-end px-3 rounded-lg",
                                activeTab === "views"
                                  ? "bg-deckly-primary"
                                  : "bg-deckly-secondary",
                              )}
                            >
                              <span className="text-[9px] font-bold text-white shadow-sm">
                                {activeTab === "views"
                                  ? s.total_views
                                  : `${avgTime.toFixed(1)}s`}
                              </span>
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
            <Zap size={14} className="text-deckly-primary" /> Real-time Sync
          </div>
          <Button onClick={onClose} size="medium">
            Done
          </Button>
        </footer>
      </motion.div>
    </div>
  );
}

export default AnalyticsModal;
