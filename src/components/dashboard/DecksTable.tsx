import React from "react";
import { DashboardCard } from "../ui/DashboardCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { BarChart3, Pencil, Trash2, FileText, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface Deck {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  total_views: number;
  last_viewed_at: string | null;
  file_url: string;
}

interface DecksTableProps {
  decks: Deck[];
  loading?: boolean;
  onDelete?: (deck: Deck) => Promise<void>;
}

export function DecksTable({ decks, loading, onDelete }: DecksTableProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleCopyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (deck: Deck) => {
    if (window.confirm(`Are you sure you want to delete "${deck.title}"?`)) {
      setDeletingId(deck.id);
      try {
        if (onDelete) await onDelete(deck);
      } catch (err) {
        console.error("Delete failed:", err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <DashboardCard className="mt-8">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 px-8">
              Name
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">
              Upload Date
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-center">
              Link
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-center">
              Views
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-center">
              Last Viewed
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right px-8">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i} className="border-slate-50">
                  <TableCell className="px-8 py-6">
                    <div className="h-4 w-40 bg-slate-50 animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="h-4 w-24 bg-slate-50 animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-lg mx-auto" />
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="h-4 w-8 bg-slate-50 animate-pulse rounded mx-auto" />
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="h-4 w-24 bg-slate-50 animate-pulse rounded mx-auto" />
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="h-4 w-24 bg-slate-50 animate-pulse rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
          ) : decks.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="p-20 text-center text-slate-400"
              >
                No decks uploaded yet
              </TableCell>
            </TableRow>
          ) : (
            decks.map((deck) => (
              <TableRow
                key={deck.id}
                className={clsx(
                  "group hover:bg-slate-50/50 border-slate-50 transition-colors",
                  deletingId === deck.id && "opacity-50 pointer-events-none",
                )}
              >
                <TableCell className="px-8 py-6">
                  <Link
                    to={`/${deck.slug}`}
                    target="_blank"
                    className="flex items-center gap-3 transition-all group/title"
                  >
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-deckly-primary transition-colors group-hover/title:bg-deckly-primary/10">
                      <FileText size={18} />
                    </div>
                    <span className="font-bold text-slate-900 group-hover/title:text-deckly-primary transition-colors">
                      {deck.title}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="py-6 text-slate-500 font-medium text-xs">
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                    .format(new Date(deck.created_at))
                    .replace(/\//g, "-")}
                </TableCell>
                <TableCell className="py-6 text-center">
                  <button
                    onClick={() => handleCopyLink(deck.slug, deck.id)}
                    className={clsx(
                      "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-2 mx-auto",
                      copiedId === deck.id
                        ? "bg-deckly-primary text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                    )}
                  >
                    {copiedId === deck.id ? (
                      <>
                        <Check size={12} strokeWidth={3} /> Copied
                      </>
                    ) : (
                      "Click to copy"
                    )}
                  </button>
                </TableCell>
                <TableCell className="py-6 text-center font-bold text-slate-900">
                  {deck.total_views}
                </TableCell>
                <TableCell className="py-6 text-center text-slate-500 font-medium text-xs">
                  {deck.last_viewed_at
                    ? new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                        .format(new Date(deck.last_viewed_at))
                        .replace(/\//g, "-")
                    : "-"}
                </TableCell>
                <TableCell className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/analytics/${deck.id}`}
                      className="p-2 text-slate-400 hover:text-deckly-primary hover:bg-white rounded-lg transition-all"
                      title="View Detailed Analytics"
                    >
                      <BarChart3 size={18} />
                    </Link>
                    <Link
                      to={`/upload?edit=${deck.id}`}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                      title="Edit Deck"
                    >
                      <Pencil size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(deck)}
                      disabled={deletingId === deck.id}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                      title="Delete Deck"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </DashboardCard>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
