import { useEffect, useState } from "react";
import { analyticsService } from "../../services/analyticsService";
import { useAuth } from "../../contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { DashboardCard } from "../ui/DashboardCard";
import { Badge } from "../ui/badge";

export function AnalyticsDashboard() {
  const [stats, setStats] = useState({ totalViews: 0, totalTimeSeconds: 0 });
  const [daily, setDaily] = useState<{
    labels: string[];
    visits: number[];
    timeSpent: number[];
  }>({ labels: [], visits: [], timeSpent: [] });
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([
        analyticsService.getUserTotalStats(session.user.id),
        analyticsService.getDailyMetrics(session.user.id),
      ])
        .then(([total, dailyData]) => {
          setStats(total);
          setDaily(dailyData);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const overviewItems = [
    { label: "Total Visit", value: stats.totalViews.toLocaleString(), sub: "" },
    {
      label: "Total Time Spent",
      value: formatTime(stats.totalTimeSeconds),
      sub: "",
    },
    { label: "Bookmarked", value: "0", sub: "Coming Soon" },
  ];

  return (
    <DashboardCard
      className="min-h-[600px]"
      contentClassName="flex flex-col md:flex-row border-t-0 h-full"
    >
      {/* Left Overview Section */}
      <div className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-slate-100 p-10 space-y-16">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Analytics
        </h3>
        <div className="space-y-12">
          {loading
            ? Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-10 w-24 bg-slate-100 animate-pulse rounded" />
                    <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
                  </div>
                ))
            : overviewItems.map((item, i) => (
                <div key={i}>
                  <div className="flex items-start gap-2">
                    <p className="text-5xl font-bold text-deckly-primary mb-1 tracking-tighter">
                      {item.value}
                    </p>
                    {item.sub && (
                      <Badge
                        variant="outline"
                        className="mt-2 bg-slate-50 text-[8px] font-black uppercase text-slate-400 border-slate-200"
                      >
                        {item.sub}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {item.label}
                  </p>
                </div>
              ))}
        </div>
      </div>

      {/* Right Chart Section */}
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="VISITS" className="flex-1 flex flex-col">
          <div className="flex items-center justify-center p-6 bg-slate-50/50">
            <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl gap-1">
              <TabsTrigger
                value="VISITS"
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-8 py-2.5 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none"
              >
                Visits
              </TabsTrigger>
              <TabsTrigger
                value="TIME"
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-8 py-2.5 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none"
              >
                Time Spend
              </TabsTrigger>
              <TabsTrigger
                value="BOOKMARKS"
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-8 py-2.5 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none"
              >
                Bookmarked
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="VISITS"
            className="flex-1 m-0 p-8 flex flex-col justify-end"
          >
            <SimpleBarChart
              labels={daily.labels}
              data={daily.visits}
              maxVal={Math.max(...daily.visits, 10)}
              loading={loading}
            />
          </TabsContent>

          <TabsContent
            value="TIME"
            className="flex-1 m-0 p-8 flex flex-col justify-end"
          >
            <SimpleBarChart
              labels={daily.labels}
              data={daily.timeSpent}
              maxVal={Math.max(...daily.timeSpent, 60)}
              loading={loading}
              isTime
            />
          </TabsContent>

          <TabsContent
            value="BOOKMARKS"
            className="flex-1 m-0 p-8 flex flex-col items-center justify-center text-center"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
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
                Bookmarks Coming Soon
              </h4>
              <p className="text-sm text-slate-500 max-w-[240px]">
                We're building a way for you to see which slides investors are
                bookmarking most.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardCard>
  );
}

function SimpleBarChart({
  labels,
  data,
  maxVal,
  loading,
  isTime = false,
}: {
  labels: string[];
  data: number[];
  maxVal: number;
  loading: boolean;
  isTime?: boolean;
}) {
  return (
    <div className="relative h-80 w-full flex items-end justify-between px-4 pb-2 border-l border-b border-slate-200">
      {/* Y-Axis mock labels */}
      <div className="absolute -left-8 bottom-0 top-0 flex flex-col justify-between text-[10px] font-bold text-slate-400 py-2">
        <span>{Math.round(maxVal)}</span>
        <span>{Math.round(maxVal * 0.75)}</span>
        <span>{Math.round(maxVal * 0.5)}</span>
        <span>{Math.round(maxVal * 0.25)}</span>
        <span>0</span>
      </div>

      {loading
        ? Array(7)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-4 w-12">
                <div className="w-8 bg-slate-50 rounded-full h-32 animate-pulse" />
                <div className="h-3 w-8 bg-slate-50 rounded animate-pulse" />
              </div>
            ))
        : data.map((val, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-4 w-12 group relative"
            >
              <div
                className="w-8 bg-slate-900 rounded-full transition-all group-hover:bg-deckly-primary cursor-pointer peer"
                style={{
                  height: `${(val / maxVal) * 100}%`,
                  minHeight: val > 0 ? "4px" : "0",
                }}
              ></div>
              <span className="text-[10px] font-bold text-slate-400">
                {labels[i]}
              </span>

              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                {isTime
                  ? `${Math.round(val / 60)}m ${Math.round(val % 60)}s`
                  : val}
              </div>
            </div>
          ))}
    </div>
  );
}
