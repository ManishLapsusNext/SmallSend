import { cn } from "@/lib/utils";
import { RefreshCw, Eye, Clock, Zap, Timer } from "lucide-react";
import type { SignalLabel } from "../../services/interestSignalService";

const signalConfig: Record<
  SignalLabel,
  { icon: React.ElementType; className: string }
> = {
  Revisited: {
    icon: RefreshCw,
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  "Viewed multiple times": {
    icon: Eye,
    className: "bg-indigo-50 text-indigo-600 border-indigo-200",
  },
  "Spent time on key slides": {
    icon: Clock,
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  "Returned quickly": {
    icon: Zap,
    className: "bg-amber-50 text-amber-600 border-amber-200",
  },
  "Extended viewing": {
    icon: Timer,
    className: "bg-violet-50 text-violet-600 border-violet-200",
  },
};

interface InterestSignalBadgeProps {
  signal: SignalLabel;
  className?: string;
}

export function InterestSignalBadge({
  signal,
  className,
}: InterestSignalBadgeProps) {
  const config = signalConfig[signal];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
        config.className,
        className,
      )}
    >
      <Icon size={12} />
      {signal}
    </span>
  );
}
