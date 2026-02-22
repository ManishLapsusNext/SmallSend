import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye,
  ChevronLeft,
  Loader2,
  Bookmark,
  MessageSquare,
  AlertCircle,
  Clock, // Added Clock import
  BarChart3, // Added BarChart3 import
} from "lucide-react";
import { analyticsService } from "../services/analyticsService";
import { deckService } from "../services/deckService";
import { Deck, DeckStats } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../utils/cn";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DashboardCard } from "../components/ui/DashboardCard";
import { Badge } from "../components/ui/badge";

export default function DeckAnalytics() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { session, isPro } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [stats, setStats] = useState<DeckStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "views" | "time" | "retention" | "downloads" | "viewers" | "comments"
  >("views");

  useEffect(() => {
    if (deckId && session?.user?.id) {
      setLoading(true);
      Promise.all([
        deckService.getDeckById(deckId),
        analyticsService.getDeckStats(deckId, !!isPro, session.user.id),
      ])
        .then(([deckData, statsData]) => {
          setDeck(deckData);
          setStats(statsData || []);
        })
        .finally(() => setLoading(false));
    }
  }, [deckId, session, isPro]);

  // Derived Stats
  const totalViews = useMemo(
    () => stats.reduce((acc, curr) => acc + curr.total_views, 0),
    [stats],
  );
  const totalSeconds = useMemo(
    () => stats.reduce((acc, curr) => acc + curr.total_time_seconds, 0),
    [stats],
  );
  const avgTimePerView = useMemo(
    () => (totalViews > 0 ? (totalSeconds / totalViews).toFixed(1) : "0"),
    [totalViews, totalSeconds],
  );

  const maxViews = useMemo(
    () => Math.max(...stats.map((s) => s.total_views), 1),
    [stats],
  );
  const maxTime = useMemo(
    () =>
      Math.max(
        ...stats.map((s) => s.total_time_seconds / (s.total_views || 1)),
        1,
      ),
    [stats],
  );

  const dropOffStats = useMemo(() => {
    return stats.map((s, idx) => {
      const nextSlide = stats[idx + 1];
      const dropOffCount = nextSlide
        ? Math.max(0, s.total_views - nextSlide.total_views)
        : 0;
      const dropOffPercent =
        s.total_views > 0 ? (dropOffCount / s.total_views) * 100 : 0;
      return { ...s, dropOffCount, dropOffPercent };
    });
  }, [stats]);

  const criticalSlide = useMemo(() => {
    if (dropOffStats.length === 0) return null;
    return [...dropOffStats].sort(
      (a, b) => b.dropOffPercent - a.dropOffPercent,
    )[0];
  }, [dropOffStats]);

  const tabs = [
    { id: "views", label: "VIEWS" },
    { id: "time", label: "TIME SPEND" },
    { id: "retention", label: "DROPOFF" },
    { id: "downloads", label: "DOWNLOADS", comingSoon: true },
    { id: "viewers", label: "VIEWERS", comingSoon: true },
    { id: "comments", label: "COMMENTS", comingSoon: true },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-deckly-primary animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Loading Analytics...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50">
              <ChevronLeft size={16} />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest">
              Back
            </span>
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{deck?.title}</h2>
          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SummaryCard
            icon={<Eye />}
            label="Total Visit"
            value={totalViews}
            color="primary"
          />
          <SummaryCard
            icon={<Clock />}
            label="Average Session"
            value={`${avgTimePerView}s`}
            color="secondary"
          />
          <SummaryCard
            icon={<Bookmark />}
            label="Bookmarked"
            value="Coming Soon"
            isPlaceholder
          />
          <SummaryCard
            icon={<MessageSquare />}
            label="Comments"
            value="Coming Soon"
            isPlaceholder
          />
        </div>

        {/* Detailed Chart Section */}
        <DashboardCard className="p-10">
          <div className="flex flex-col space-y-12">
            <div className="flex flex-col items-center space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                Engagement per Slide
              </h3>

              <div className="flex flex-wrap justify-center bg-slate-50 p-1.5 rounded-2xl gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() =>
                      !tab.comingSoon && setActiveTab(tab.id as any)
                    }
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                      activeTab === tab.id
                        ? "bg-deckly-primary text-white shadow-lg shadow-deckly-primary/20"
                        : "text-slate-500 hover:bg-white hover:text-slate-900",
                      tab.comingSoon &&
                        "opacity-50 cursor-not-allowed grayscale",
                    )}
                  >
                    {tab.label}
                    {tab.comingSoon && (
                      <span className="text-[7px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded ml-1">
                        CS
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide List / Bar Chart */}
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              {stats.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <BarChart3 size={32} />
                  </div>
                  <p className="text-slate-500 font-medium">
                    No activity recorded for this deck yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Retention Alert */}
                  {activeTab === "retention" &&
                    criticalSlide &&
                    criticalSlide.dropOffPercent > 20 && (
                      <div className="mb-8 p-6 rounded-3xl bg-red-50/50 border border-red-100 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white text-red-500 flex items-center justify-center shadow-sm border border-red-100 shrink-0">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
                            Drop-off Alert
                          </p>
                          <p className="text-sm text-slate-600 font-medium">
                            Slide{" "}
                            <span className="font-bold">
                              {criticalSlide.page_number}
                            </span>{" "}
                            has a high churn rate of{" "}
                            <span className="text-red-600 font-bold">
                              {criticalSlide.dropOffPercent.toFixed(0)}%
                            </span>
                            . Consider refining this slide's content.
                          </p>
                        </div>
                      </div>
                    )}

                  <div className="space-y-4">
                    {(activeTab === "retention" ? dropOffStats : stats).map(
                      (s: any) => {
                        const avgTime =
                          s.total_views > 0
                            ? s.total_time_seconds / s.total_views
                            : 0;
                        const viewPercent = (s.total_views / maxViews) * 100;
                        const timePercent = (avgTime / maxTime) * 100;
                        const retentionPercent = s.dropOffPercent;

                        const percentage =
                          activeTab === "views"
                            ? viewPercent
                            : activeTab === "time"
                              ? timePercent
                              : retentionPercent;

                        const value =
                          activeTab === "views"
                            ? s.total_views
                            : activeTab === "time"
                              ? `${avgTime.toFixed(1)}s`
                              : `${s.dropOffPercent.toFixed(0)}%`;

                        return (
                          <div
                            key={s.page_number}
                            className="flex items-center gap-6 group"
                          >
                            <span className="text-[10px] font-black text-slate-300 w-10 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">
                              Pg {s.page_number}
                            </span>
                            <div className="flex-1 h-10 bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100/50">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.max(percentage, 2)}%`,
                                }}
                                transition={{
                                  duration: 1.2,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className={cn(
                                  "h-full flex items-center justify-end px-4 rounded-r-2xl shadow-xl shadow-opacity-10",
                                  activeTab === "views"
                                    ? "bg-deckly-primary shadow-deckly-primary/30"
                                    : activeTab === "time"
                                      ? "bg-slate-900 shadow-slate-900/10"
                                      : percentage > 30
                                        ? "bg-red-500 shadow-red-500/30"
                                        : "bg-deckly-primary/60",
                                )}
                              >
                                <span className="text-[11px] font-black text-white">
                                  {value}
                                </span>
                              </motion.div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color = "primary",
  isPlaceholder = false,
}: any) {
  return (
    <DashboardCard className="p-8 group hover:border-slate-300 transition-all cursor-default">
      <div className="flex items-start justify-between mb-6">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110",
            color === "primary"
              ? "bg-deckly-primary shadow-lg shadow-deckly-primary/20"
              : color === "secondary"
                ? "bg-slate-900 shadow-lg shadow-slate-900/20"
                : "bg-slate-50 text-slate-400",
          )}
        >
          {React.cloneElement(icon, { size: 24 })}
        </div>
        {isPlaceholder && (
          <Badge
            variant="outline"
            className="bg-slate-50 text-[7px] font-black uppercase text-slate-400 border-slate-200"
          >
            Coming Soon
          </Badge>
        )}
      </div>
      <div>
        <p
          className={cn(
            "text-4xl font-black mb-1 tracking-tighter",
            isPlaceholder ? "text-slate-300 text-2xl" : "text-slate-900",
          )}
        >
          {value}
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </p>
      </div>
    </DashboardCard>
  );
}
