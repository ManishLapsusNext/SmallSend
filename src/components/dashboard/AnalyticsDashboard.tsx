import { useEffect, useState, useMemo } from "react";
import { analyticsService } from "../../services/analyticsService";
import { useAuth } from "../../contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { DashboardCard } from "../ui/DashboardCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { AnalyticsStatsSection } from "./AnalyticsStatsSection";

export function AnalyticsDashboard() {
  const { session } = useAuth();

  // Initialize from cache
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(
        `dashboard-analytics-cache-${session?.user?.id}`,
      );
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const initialCache = getCachedData();
  const [stats, setStats] = useState(
    initialCache?.stats || {
      totalViews: 0,
      totalTimeSeconds: 0,
      totalSaves: 0,
    },
  );
  const [daily, setDaily] = useState<{
    labels: string[];
    visits: number[];
    timeSpent: number[];
  }>(initialCache?.daily || { labels: [], visits: [], timeSpent: [] });

  const [loading, setLoading] = useState(!initialCache);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      // Only show skeleton if we have no data
      if (stats.totalViews === 0) setLoading(true);
      setIsRefreshing(true);

      Promise.all([
        analyticsService.getUserTotalStats(session.user.id),
        analyticsService.getDailyMetrics(session.user.id),
      ])
        .then(([total, dailyData]) => {
          setStats(total);
          setDaily(dailyData);

          localStorage.setItem(
            `dashboard-analytics-cache-${session.user.id}`,
            JSON.stringify({
              stats: total,
              daily: dailyData,
              timestamp: Date.now(),
            }),
          );
        })
        .catch((err) => console.error("Dashboard fetch error:", err))
        .finally(() => {
          setLoading(false);
          setIsRefreshing(false);
        });
    }
  }, [session?.user?.id]); // Remove initialCache from dependencies

  const overviewItems = useMemo(() => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${mins}m ${secs}s`;
    };

    return [
      {
        label: "Total Visit",
        value: stats.totalViews.toLocaleString(),
        sub: "",
      },
      {
        label: "Total Time Spent",
        value: formatTime(stats.totalTimeSeconds),
        sub: "",
      },
      {
        label: "Bookmarked",
        value: (stats.totalSaves || 0).toLocaleString(),
        sub: "",
      },
    ];
  }, [stats]);

  return (
    <DashboardCard
      className="min-h-[400px] md:min-h-[600px]"
      contentClassName="flex flex-col md:flex-row border-t-0 h-full relative"
    >
      {isRefreshing && !loading && (
        <div className="absolute top-4 right-8 flex items-center gap-2 z-10">
          <div className="w-1.5 h-1.5 bg-deckly-primary rounded-full animate-ping" />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
            Syncing...
          </span>
        </div>
      )}
      <AnalyticsStatsSection items={overviewItems} loading={loading} />

      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="VISITS" className="flex-1 flex flex-col">
          <div className="flex items-center justify-center p-4 md:p-6 bg-slate-50/50">
            <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl gap-1">
              <TabsTrigger
                value="VISITS"
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 md:px-8 py-2 md:py-2.5 text-slate-500 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none transition-colors"
              >
                Visits
              </TabsTrigger>
              <TabsTrigger
                value="TIME"
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 md:px-8 py-2 md:py-2.5 text-slate-500 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none transition-colors"
              >
                <span className="md:hidden">Time</span>
                <span className="hidden md:inline">Time Spend</span>
              </TabsTrigger>
              <TabsTrigger
                value="BOOKMARKS"
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 md:px-8 py-2 md:py-2.5 text-slate-500 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none transition-colors"
              >
                <span className="md:hidden">Saved</span>
                <span className="hidden md:inline">Bookmarked</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="VISITS"
            className="flex-1 m-0 p-4 md:p-8 pb-8 md:pb-12 flex flex-col justify-end"
          >
            <AnalyticsChart
              labels={daily.labels}
              data={daily.visits}
              loading={loading}
            />
          </TabsContent>

          <TabsContent
            value="TIME"
            className="flex-1 m-0 p-4 md:p-8 pb-8 md:pb-12 flex flex-col justify-end"
          >
            <AnalyticsChart
              labels={daily.labels}
              data={daily.timeSpent}
              loading={loading}
              isTime
            />
          </TabsContent>

          <TabsContent
            value="BOOKMARKS"
            className="flex-1 m-0 p-8 flex flex-col items-center justify-center text-center"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-deckly-primary/10 rounded-full flex items-center justify-center mx-auto text-deckly-primary">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900">
                {stats.totalSaves || 0} Saved Decks
              </h4>
              <p className="text-sm text-slate-500 max-w-[280px]">
                Investors have bookmarked your assets {stats.totalSaves || 0}{" "}
                times for easy access in their library.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardCard>
  );
}
