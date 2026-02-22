import { DashboardCard } from "../ui/DashboardCard";
import { Badge } from "../ui/badge";

interface ContentStatsCardProps {
  totalViews: number;
  totalTimeSeconds: number;
  loading?: boolean;
}

export function ContentStatsCard({
  totalViews,
  totalTimeSeconds,
  loading,
}: ContentStatsCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const stats = [
    {
      label: "Total Visit",
      value: totalViews.toLocaleString(),
      color: "text-deckly-primary",
    },
    {
      label: "Total Time Spent",
      value: formatTime(totalTimeSeconds),
      color: "text-deckly-primary",
    },
    {
      label: "Bookmarked",
      value: "100",
      color: "text-deckly-primary",
      sub: "Coming Soon",
    },
  ];

  return (
    <DashboardCard className="py-12 px-8">
      <div className="flex flex-col md:flex-row items-center justify-around gap-12">
        {stats.map((stat, i) => (
          <div key={i} className="text-center group">
            <div className="flex items-start justify-center gap-1 mb-1">
              <span
                className={clsx(
                  "text-6xl font-bold tracking-tighter transition-transform group-hover:scale-105 duration-300",
                  stat.color,
                )}
              >
                {loading ? "..." : stat.value}
              </span>
              {stat.sub && (
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-[8px] font-black uppercase text-slate-400 border-slate-200 mt-2"
                >
                  {stat.sub}
                </Badge>
              )}
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

function clsx(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
