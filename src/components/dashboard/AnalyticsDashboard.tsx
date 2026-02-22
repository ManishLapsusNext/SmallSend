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
      setLoading(true);
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
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-8 py-2.5 text-slate-500 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none transition-colors"
              >
                Visits
              </TabsTrigger>
              <TabsTrigger
                value="TIME"
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-8 py-2.5 text-slate-500 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none transition-colors"
              >
                Time Spend
              </TabsTrigger>
              <TabsTrigger
                value="BOOKMARKS"
                className="rounded-lg text-[10px] font-black uppercase tracking-widest px-8 py-2.5 text-slate-500 data-[state=active]:bg-deckly-primary data-[state=active]:text-white shadow-none transition-colors"
              >
                Bookmarked
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="VISITS"
            className="flex-1 m-0 p-8 pb-12 flex flex-col justify-end"
          >
            <SimpleBarChart
              labels={daily.labels}
              data={daily.visits}
              loading={loading}
            />
          </TabsContent>

          <TabsContent
            value="TIME"
            className="flex-1 m-0 p-8 pb-12 flex flex-col justify-end"
          >
            <SimpleBarChart
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

/**
 * Finds a "nice" maximum value for the Y-axis to avoid awkward labels.
 * E.g., for 46, returns 50. For 110, returns 150.
 */
function findNiceMax(val: number, minCeiling: number = 10): number {
  if (val <= 0) return minCeiling;
  const max = Math.max(val, minCeiling);

  // For small numbers, round to nearest 5 or 10
  if (max <= 50) return Math.ceil(max / 5) * 5;
  if (max <= 100) return Math.ceil(max / 10) * 10;

  // For larger numbers, find the magnitude
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalized = max / magnitude;

  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;

  return nice * magnitude;
}

function SimpleBarChart({
  labels,
  data,
  loading,
  isTime = false,
}: {
  labels: string[];
  data: number[];
  loading: boolean;
  isTime?: boolean;
}) {
  const maxVal = Math.max(...data, 0);
  const niceMax = findNiceMax(maxVal, isTime ? 60 : 10);

  const formatYLabel = (val: number) => {
    if (!isTime) return val;
    if (val === 0) return "0";
    if (val >= 60) return `${Math.round(val / 60)}m`;
    return `${val}s`;
  };

  return (
    <div className="w-full flex flex-col justify-end">
      <div className="flex items-stretch h-64">
        {/* Y-Axis Labels */}
        <div className="w-12 flex flex-col justify-between py-0 pr-3 text-right">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <span
              key={ratio}
              className="text-[10px] font-bold text-slate-400 leading-none h-0 flex items-center justify-end"
            >
              {formatYLabel(Math.round(niceMax * ratio))}
            </span>
          ))}
        </div>

        {/* Chart Grid Area */}
        <div className="flex-1 border-l border-b border-slate-200 relative flex items-end justify-center gap-8 px-4">
          {loading
            ? Array(7)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-full flex flex-col justify-end pb-1"
                  >
                    <div className="w-8 mx-auto bg-slate-50 rounded-full h-32 animate-pulse" />
                  </div>
                ))
            : data.map((val, i) => (
                <div
                  key={i}
                  className="w-12 h-full group relative flex flex-col justify-end"
                >
                  {/* Column Hover Background */}
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-50/0 group-hover:bg-slate-50/50 transition-colors rounded-t-xl -mx-2 pointer-events-none" />

                  <div
                    className="w-full flex flex-col justify-end pb-1 relative z-10 transition-all duration-500 ease-out"
                    style={{ height: `${(val / niceMax) * 100}%` }}
                  >
                    <div className="w-8 mx-auto bg-slate-900 rounded-full transition-all group-hover:bg-deckly-primary cursor-pointer flex flex-col justify-end overflow-hidden shadow-sm group-hover:shadow-lg group-hover:shadow-deckly-primary/20 h-full">
                      {/* Subtle fill effect */}
                      <div className="w-full h-1/2 bg-white/5" />
                    </div>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 shadow-2xl scale-90 group-hover:scale-100 origin-bottom border border-white/10">
                    {isTime
                      ? `${Math.floor(val / 60)}m ${Math.round(val % 60)}s`
                      : `${val} Visits`}
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="flex items-start mt-6 pl-12 h-6">
        <div className="flex-1 flex justify-center gap-8 px-4">
          {labels.map((label, i) => (
            <div key={i} className="w-12 text-center group">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-deckly-primary transition-colors block">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
