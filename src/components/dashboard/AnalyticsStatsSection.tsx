import { Badge } from "../ui/badge";

interface StatItem {
  label: string;
  value: string;
  sub?: string;
}

interface AnalyticsStatsSectionProps {
  items: StatItem[];
  loading: boolean;
}

export function AnalyticsStatsSection({
  items,
  loading,
}: AnalyticsStatsSectionProps) {
  return (
    <div className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-slate-100 p-5 md:p-10 md:space-y-16">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 md:mb-0">
        Analytics
      </h3>
      <div className="flex flex-row flex-wrap gap-6 md:flex-col md:space-y-12 md:gap-0">
        {loading
          ? Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 md:h-10 w-20 md:w-24 bg-slate-100 animate-pulse rounded" />
                  <div className="h-3 md:h-4 w-24 md:w-32 bg-slate-100 animate-pulse rounded" />
                </div>
              ))
          : items.map((item, i) => (
              <div key={i}>
                <div className="flex items-start gap-2">
                  <p className="text-3xl md:text-5xl font-bold text-deckly-primary mb-1 tracking-tighter">
                    {item.value}
                  </p>
                  {item.sub && (
                    <Badge
                      variant="outline"
                      className="mt-1 md:mt-2 bg-slate-50 text-[8px] font-black uppercase text-slate-400 border-slate-200"
                    >
                      {item.sub}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] md:text-xs font-bold text-slate-900">
                  {item.label}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}
