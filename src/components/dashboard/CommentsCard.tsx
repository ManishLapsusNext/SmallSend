import { DashboardCard } from "../ui/DashboardCard";
import { Badge } from "../ui/badge";

export function CommentsCard() {
  return (
    <DashboardCard
      title="Recent Comments"
      headerAction={
        <Badge
          variant="outline"
          className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase"
        >
          Coming Soon
        </Badge>
      }
      contentClassName="p-12 flex flex-col items-center justify-center text-center"
    >
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-500 max-w-[200px] leading-relaxed">
        Investor comments and reactions will appear here.
      </p>
    </DashboardCard>
  );
}
