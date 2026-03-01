import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  ChevronLeft,
  Bookmark,
  MessageSquare,
  AlertCircle,
  Clock,
  BarChart3,
  Users,
  ChevronDown,
} from "lucide-react";
import { analyticsService } from "../services/analyticsService";
import { deckService } from "../services/deckService";
import { Deck, DeckStats } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DashboardCard } from "../components/ui/DashboardCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  getVisitorSignals,
  VisitorSignal,
} from "../services/interestSignalService";
import { InterestSignalBadge } from "../components/dashboard/InterestSignalBadge";

export default function DeckAnalytics() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { session, isPro } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [stats, setStats] = useState<DeckStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "views"
    | "time"
    | "retention"
    | "bookmarks"
    | "downloads"
    | "viewers"
    | "comments"
  >("views");
  const [visitorSignals, setVisitorSignals] = useState<VisitorSignal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [totalSaves, setTotalSaves] = useState(0);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deckId && session?.user?.id) {
      setLoading(true);
      Promise.all([
        deckService.getDeckById(deckId),
        analyticsService.getDeckStats(deckId, !!isPro, session.user.id),
        analyticsService.getUserTotalStats(session.user.id, deckId, true),
        analyticsService.getDeckBookmarks(deckId).catch((err) => {
          console.error("Error fetching bookmarks:", err);
          return []; // Fallback to empty bookmarks if join fails
        }),
      ])
        .then(([deckData, statsData, totalData, bookmarksData]) => {
          setDeck(deckData);
          setStats(statsData || []);
          setTotalSaves(totalData.totalSaves || 0);
          setBookmarks(bookmarksData || []);
        })
        .catch((err) => {
          console.error("Critical error loading analytics:", err);
          // Only show error if we couldn't even get basic deck info
          if (!deck) setError("Failed to load analytics data.");
        })
        .finally(() => setLoading(false));

      // Fetch interest signals
      setSignalsLoading(true);
      getVisitorSignals(deckId)
        .then(setVisitorSignals)
        .finally(() => setSignalsLoading(false));

      // Fetch unique visitor count
      analyticsService.getUniqueVisitorCount(deckId).then(setUniqueVisitors);
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
    { id: "bookmarks", label: "BOOKMARKS" },
    { id: "downloads", label: "DOWNLOADS", comingSoon: true },
    { id: "viewers", label: "VIEWERS", comingSoon: true },
    { id: "comments", label: "COMMENTS", comingSoon: true },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Deck Analytics">
        <div className="flex-1 flex flex-col items-center justify-center py-40 gap-4 text-slate-400">
          <div className="w-10 h-10 border-2 border-deckly-primary/20 border-t-deckly-primary rounded-full animate-spin" />
          <p className="font-medium font-bold uppercase tracking-widest text-[10px]">
            Gathering Insights...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !deck) {
    return (
      <DashboardLayout title="Deck Analytics">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-[40px] p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-8">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
              {error ? "Loading Error" : "Access Restricted"}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-10">
              {error ||
                "The analytics for this deck could not be loaded or you don't have permission to view them."}
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/content")}
            >
              Return to Content
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  console.log("Analytics State:", { deck, stats, totalSaves, bookmarks });

  return (
    <DashboardLayout title="Deck Analytics">
      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/content")}
            className="text-slate-400 hover:text-slate-900 px-2 self-start"
          >
            <ChevronLeft size={16} className="mr-2" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Back
            </span>
          </Button>
          <h2 className="text-lg md:text-2xl font-bold text-slate-900 truncate">
            {deck?.title}
          </h2>
          <div className="hidden md:block w-24" /> {/* Spacer */}
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <SummaryCard
            icon={<Eye />}
            label="Total Visit"
            value={uniqueVisitors}
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
            value={totalSaves.toLocaleString()}
            color="primary"
          />
          <SummaryCard
            icon={<MessageSquare />}
            label="Comments"
            value="Coming Soon"
            isPlaceholder
          />
        </div>

        {/* Detailed Chart Section */}
        <DashboardCard className="p-4 md:p-10">
          <div className="flex flex-col space-y-6 md:space-y-12">
            <div className="flex flex-col items-center space-y-4 md:space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                Engagement per Slide
              </h3>

              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  const tab = tabs.find((t) => t.id === v);
                  if (tab && !tab.comingSoon) setActiveTab(v as any);
                }}
                className="w-full flex flex-col items-center"
              >
                <TabsList className="bg-white border border-slate-200 p-1.5 h-auto rounded-xl gap-1 flex-wrap justify-center">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden text-slate-700 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none",
                        tab.comingSoon &&
                          "opacity-50 cursor-not-allowed grayscale",
                      )}
                    >
                      {tab.label}
                      {tab.comingSoon && (
                        <span className="text-[7px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded ml-1 font-bold">
                          CS
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Slide List / Bar Chart or Bookmarks */}
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              {activeTab === "bookmarks" ? (
                bookmarks.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Bookmark size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">
                      No one has bookmarked this deck yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {bookmarks.map((b: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 md:p-6 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-deckly-primary/10 flex items-center justify-center text-deckly-primary font-bold">
                            {b.profiles?.full_name?.[0] || "I"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {b.profiles?.full_name || "Anonymous Investor"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Saved on{" "}
                              {new Date(b.created_at).toLocaleDateString()} at{" "}
                              {new Date(b.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            Status
                          </p>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-600 border-green-100 text-[10px] font-bold"
                          >
                            Live in Library
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : stats.length === 0 ? (
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
                            <span className="text-[10px] font-black text-slate-400 w-10 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">
                              Pg {s.page_number}
                            </span>
                            <div className="flex-1 h-11 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100/50">
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
                                  "h-full flex items-center justify-end px-4 rounded-r-xl",
                                  activeTab === "views"
                                    ? "bg-deckly-primary"
                                    : activeTab === "time"
                                      ? "bg-slate-900"
                                      : percentage > 30
                                        ? "bg-red-500"
                                        : "bg-deckly-primary/60",
                                )}
                              >
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
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

        {/* Visitor Engagement Signals */}
        <DashboardCard className="p-4 md:p-10">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-deckly-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Visitor Engagement Signals
              </h3>
              {visitorSignals.length > 0 && (
                <span className="ml-auto text-[10px] font-bold text-deckly-primary bg-deckly-primary/10 px-2.5 py-1 rounded-full">
                  {visitorSignals.length} engaged
                </span>
              )}
            </div>

            {signalsLoading ? (
              <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-deckly-primary/20 border-t-deckly-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Analyzing engagement...
                </p>
              </div>
            ) : visitorSignals.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Users size={24} />
                </div>
                <p className="text-sm font-bold text-slate-400">
                  No engagement signals yet
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Signals appear when visitors show repeated interest —
                  revisits, extended viewing, or deep reading.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitorSignals.map((visitor, idx) => (
                  <motion.div
                    key={visitor.visitorId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-all overflow-hidden cursor-pointer"
                    onClick={() =>
                      setExpandedVisitor(
                        expandedVisitor === visitor.visitorId
                          ? null
                          : visitor.visitorId,
                      )
                    }
                  >
                    <div className="p-4 md:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-deckly-primary/10 flex items-center justify-center">
                            <span className="text-xs font-black text-deckly-primary">
                              #{idx + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {visitor.viewerEmail || `Visitor #${idx + 1}`}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {visitor.totalVisits} slide views ·{" "}
                              {visitor.totalTime}s total ·{" "}
                              {visitor.distinctDays} day
                              {visitor.distinctDays > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {visitor.signals.length} signal
                              {visitor.signals.length > 1 ? "s" : ""}
                            </p>
                          </div>
                          <ChevronDown
                            size={16}
                            className={cn(
                              "text-slate-400 transition-transform duration-200",
                              expandedVisitor === visitor.visitorId &&
                                "rotate-180",
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visitor.signals.map((signal) => (
                          <InterestSignalBadge key={signal} signal={signal} />
                        ))}
                      </div>
                    </div>

                    {/* Expandable Slide Time Breakdown */}
                    <AnimatePresence>
                      {expandedVisitor === visitor.visitorId &&
                        visitor.slideBreakdown.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 md:px-5 pb-4 md:pb-5 pt-2 border-t border-slate-200 max-h-[280px] overflow-y-auto">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                Time per Slide
                              </p>
                              <div className="flex items-end gap-1 h-[180px] overflow-x-auto pb-6 relative">
                                {(() => {
                                  const maxTime = Math.max(
                                    ...visitor.slideBreakdown.map(
                                      (s) => s.time,
                                    ),
                                    1,
                                  );
                                  return visitor.slideBreakdown.map((slide) => {
                                    const percent =
                                      (slide.time / maxTime) * 100;
                                    const mins = Math.floor(slide.time / 60);
                                    const secs = slide.time % 60;
                                    const timeLabel =
                                      mins > 0
                                        ? `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
                                        : `${secs}s`;
                                    return (
                                      <div
                                        key={slide.page}
                                        className="flex flex-col items-center flex-1 min-w-[24px] max-w-[48px] relative h-full justify-end"
                                      >
                                        <span className="text-[8px] font-bold text-slate-400 mb-1 shrink-0">
                                          {timeLabel}
                                        </span>
                                        <motion.div
                                          initial={{ height: 0 }}
                                          animate={{
                                            height: `${Math.max(percent, 3)}%`,
                                          }}
                                          transition={{
                                            duration: 0.4,
                                            delay: slide.page * 0.03,
                                          }}
                                          className={cn(
                                            "w-full rounded-t-md",
                                            percent > 60
                                              ? "bg-deckly-primary"
                                              : percent > 30
                                                ? "bg-deckly-primary/70"
                                                : "bg-deckly-primary/40",
                                          )}
                                        />
                                        <span className="text-[9px] font-bold text-slate-400 mt-1 absolute -bottom-5">
                                          {slide.page}
                                        </span>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
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
    <DashboardCard className="p-4 md:p-8 group hover:border-slate-300 transition-all cursor-default">
      <div className="flex items-start justify-between mb-3 md:mb-6">
        <div
          className={cn(
            "w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110",
            color === "primary"
              ? "bg-deckly-primary"
              : color === "secondary"
                ? "bg-slate-900"
                : "bg-slate-50 text-slate-400",
          )}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 })
            : icon}
        </div>
        {isPlaceholder && (
          <Badge
            variant="outline"
            className="bg-slate-50 text-[7px] font-black uppercase text-slate-400 border-slate-200 hidden md:inline-flex"
          >
            Coming Soon
          </Badge>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <p
            className={cn(
              "text-2xl md:text-5xl font-bold mb-1 tracking-tighter",
              isPlaceholder
                ? "text-slate-300 text-xl md:text-3xl"
                : "text-deckly-primary",
            )}
          >
            {value}
          </p>
        </div>
        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
          {label}
        </p>
      </div>
    </DashboardCard>
  );
}
