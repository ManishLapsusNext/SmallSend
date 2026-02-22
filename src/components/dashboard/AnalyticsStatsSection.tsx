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
          : items.map((item, i) => (
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
                <p className="text-xs font-bold text-slate-900">{item.label}</p>
              </div>
            ))}
      </div>
    </div>
  );
}
