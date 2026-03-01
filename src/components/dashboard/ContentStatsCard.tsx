import { useMemo } from "react";
import { DashboardCard } from "../ui/DashboardCard";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

interface ContentStatsCardProps {
  totalViews: number;
  totalTimeSeconds: number;
  totalSaves: number;
  loading?: boolean;
}

export function ContentStatsCard({
  totalViews,
  totalTimeSeconds,
  totalSaves,
  loading,
}: ContentStatsCardProps) {
  const stats = useMemo(() => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${mins}m ${secs}s`;
    };

    return [
      {
        label: "Total Visit",
        value: totalViews.toLocaleString(),
      },
      {
        label: "Total Time Spent",
        value: formatTime(totalTimeSeconds),
      },
      {
        label: "Bookmarked",
        value: (totalSaves || 0).toLocaleString(),
      },
    ] as { label: string; value: string; sub?: string }[];
  }, [totalViews, totalTimeSeconds, totalSaves]);

  return (
    <DashboardCard className="py-4 md:py-12 px-4 md:px-8">
      <div className="flex flex-row items-center justify-around gap-2 md:gap-12">
        {stats.map((stat, i) => (
          <div key={i} className="text-center group flex-1 min-w-0">
            <div className="flex items-start justify-center gap-1 md:gap-2 mb-1">
              <span
                className={cn(
                  "text-2xl md:text-6xl font-bold tracking-tighter transition-transform group-hover:scale-105 duration-300 text-deckly-primary",
                )}
              >
                {loading ? "..." : stat.value}
              </span>
              {stat.sub && (
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-[8px] font-black uppercase text-slate-400 border-slate-200 mt-1 md:mt-2 hidden md:inline-flex"
                >
                  {stat.sub}
                </Badge>
              )}
            </div>
            <p className="text-[9px] md:text-xs font-bold text-slate-900 uppercase tracking-widest leading-tight">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
