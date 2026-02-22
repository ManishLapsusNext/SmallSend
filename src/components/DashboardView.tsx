import { TopDecksCard } from "./dashboard/TopDecksCard";
import { CommentsCard } from "./dashboard/CommentsCard";
import { AnalyticsDashboard } from "./dashboard/AnalyticsDashboard";

export function DashboardView() {
  return (
    <div className="space-y-12 pb-12">
      {/* Top Row: Decks and Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
        <TopDecksCard />
        <CommentsCard />
      </div>

      {/* Analytics Section */}
      <AnalyticsDashboard />
    </div>
  );
}
