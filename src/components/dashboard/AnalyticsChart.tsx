interface AnalyticsChartProps {
  labels: string[];
  data: number[];
  loading: boolean;
  isTime?: boolean;
}

/**
 * Finds a "nice" maximum value for the Y-axis to avoid awkward labels.
 */
function findNiceMax(val: number, minCeiling: number = 10): number {
  if (val <= 0) return minCeiling;
  const max = Math.max(val, minCeiling);

  if (max <= 50) return Math.ceil(max / 5) * 5;
  if (max <= 100) return Math.ceil(max / 10) * 10;

  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalized = max / magnitude;

  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;

  return nice * magnitude;
}

export function AnalyticsChart({
  labels,
  data,
  loading,
  isTime = false,
}: AnalyticsChartProps) {
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
        <div className="flex-1 border-l border-b border-slate-200 relative flex items-end justify-between gap-1 px-2">
          {loading
            ? Array(7)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 max-w-12 h-full flex flex-col justify-end pb-1"
                  >
                    <div className="w-full bg-slate-50 rounded-full h-32 animate-pulse" />
                  </div>
                ))
            : data.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 max-w-12 h-full group relative flex flex-col justify-end"
                >
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-50/0 group-hover:bg-slate-50/50 transition-colors rounded-t-xl pointer-events-none" />

                  <div
                    className="w-full flex flex-col justify-end pb-1 relative z-10 transition-all duration-500 ease-out"
                    style={{ height: `${(val / niceMax) * 100}%` }}
                  >
                    <div className="w-3/4 mx-auto bg-slate-900 rounded-full transition-all group-hover:bg-deckly-primary cursor-pointer flex flex-col justify-end overflow-hidden shadow-sm group-hover:shadow-lg group-hover:shadow-deckly-primary/20 h-full">
                      <div className="w-full h-1/2 bg-white/5" />
                    </div>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 shadow-2xl scale-90 group-hover:scale-100 origin-bottom border border-white/10">
                    {isTime
                      ? `${Math.floor(val / 60)}m ${Math.round(val % 60)}s`
                      : `${val} Visits`}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="flex items-start mt-2 pl-12 h-6">
        <div className="flex-1 flex justify-between gap-1 px-2">
          {labels.map((label, i) => (
            <div
              key={i}
              className="flex-1 max-w-12 text-center group overflow-hidden"
            >
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-deckly-primary transition-colors block truncate">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
