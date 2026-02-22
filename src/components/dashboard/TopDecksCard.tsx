import { useEffect, useState } from "react";
import { analyticsService } from "../../services/analyticsService";
import { useAuth } from "../../contexts/AuthContext";
import { DashboardCard } from "../ui/DashboardCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface DeckStat {
  id: string;
  title: string;
  views: number;
  time: number;
  completion?: string;
}

export function TopDecksCard() {
  const [stats, setStats] = useState<DeckStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      analyticsService
        .getTopPerformingDecks(session.user.id)
        .then((data: any[]) => {
          const mapped = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            views: d.views,
            time: d.time,
            completion: "84%",
          }));
          setStats(mapped);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  return (
    <DashboardCard
      title="Top Performing Decks"
      headerAction={
        <div className="w-2 h-2 rounded-full bg-deckly-primary"></div>
      }
    >
      <Table>
        <TableHeader className="hidden">
          <TableRow>
            <TableHead>Deck</TableHead>
            <TableHead className="text-right">Stats</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="p-6">
                    <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="p-6 text-right">
                    <div className="h-4 w-16 bg-slate-100 animate-pulse rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
          ) : stats.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2}
                className="p-12 text-center text-slate-400 text-sm"
              >
                No data yet
              </TableCell>
            </TableRow>
          ) : (
            stats.map((deck) => (
              <TableRow
                key={deck.id}
                className="hover:bg-slate-50 border-b border-slate-50 last:border-0 group transition-colors"
              >
                <TableCell className="px-6 py-6 min-w-[200px]">
                  <span className="font-bold text-slate-900 group-hover:text-deckly-primary transition-colors">
                    {deck.title}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-6 text-right">
                  <div className="flex gap-8 justify-end">
                    <div className="text-right">
                      <p className="text-xl font-bold text-deckly-primary leading-none">
                        {deck.views.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                        Views
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-deckly-primary leading-none">
                        {deck.completion || "0%"}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                        Completion
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!loading && stats.length > 0 && stats.length < 3 && (
        <div className="h-24"></div>
      )}
    </DashboardCard>
  );
}
