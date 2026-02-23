import { useEffect, useState, useCallback } from "react";
import { analyticsService } from "../../services/analyticsService";
import { getDeckSignalCount } from "../../services/interestSignalService";
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
  const { session } = useAuth();

  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(
        `top-decks-cache-${session?.user?.id}`,
      );
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const initialCache = getCachedData();
  const [stats, setStats] = useState<DeckStat[]>(initialCache || []);
  const [loading, setLoading] = useState(!initialCache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [signalCounts, setSignalCounts] = useState<Record<string, number>>({});

  const fetchTopDecks = useCallback(async () => {
    if (!session?.user?.id) return;

    if (stats.length === 0) setLoading(true);
    setIsRefreshing(true);

    try {
      const data = await analyticsService.getTopPerformingDecks(
        session.user.id,
      );
      const mapped = data.map((d: any) => ({
        id: d.id,
        title: d.title,
        views: d.views,
        time: d.time,
        completion: "84%", // Placeholder for future metric
      }));
      setStats(mapped);

      // Fetch signal counts for each deck
      const counts: Record<string, number> = {};
      await Promise.all(
        mapped.map(async (d: DeckStat) => {
          counts[d.id] = await getDeckSignalCount(d.id);
        }),
      );
      setSignalCounts(counts);

      localStorage.setItem(
        `top-decks-cache-${session.user.id}`,
        JSON.stringify(mapped),
      );
    } catch (err) {
      console.error("Failed to fetch top decks:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [session?.user?.id]); // Remove initialCache dependency

  useEffect(() => {
    fetchTopDecks();
  }, [fetchTopDecks]);

  return (
    <DashboardCard
      title="Top Performing Decks"
      headerAction={
        <div className="flex items-center gap-3">
          {isRefreshing && !loading && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-deckly-primary rounded-full animate-ping" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                Syncing
              </span>
            </div>
          )}
          <div className="w-2 h-2 rounded-full bg-deckly-primary animate-pulse shadow-[0_0_8px_rgba(42,212,133,0.5)]"></div>
        </div>
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
                <TableRow
                  key={i}
                  className="border-b border-slate-50 last:border-0"
                >
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
                className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest"
              >
                No statistical data available yet
              </TableCell>
            </TableRow>
          ) : (
            stats.map((deck) => (
              <TableRow
                key={deck.id}
                className="hover:bg-slate-50/50 border-b border-slate-50 last:border-0 group transition-all duration-300"
              >
                <TableCell className="px-6 py-6 min-w-[200px]">
                  <span className="font-bold text-slate-900 group-hover:text-deckly-primary transition-colors">
                    {deck.title}
                  </span>
                  {signalCounts[deck.id] > 0 && (
                    <p className="text-[10px] font-bold text-deckly-primary mt-0.5">
                      {signalCounts[deck.id]} interested viewer
                      {signalCounts[deck.id] > 1 ? "s" : ""}
                    </p>
                  )}
                </TableCell>
                <TableCell className="px-6 py-6 text-right">
                  <div className="flex gap-8 justify-end">
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900 group-hover:text-deckly-primary transition-colors leading-none tracking-tighter">
                        {deck.views.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                        Views
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900 group-hover:text-deckly-primary transition-colors leading-none tracking-tighter">
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
