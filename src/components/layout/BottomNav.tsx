import {
  LayoutDashboard,
  FileText,
  Monitor,
  BarChart3,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Content", href: "/content" },
  { icon: Monitor, label: "Rooms", href: "/rooms" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Mail, label: "Inbox", href: "/inbox" },
  { icon: MessageCircle, label: "Requests", href: "/requests" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121212] border-t border-white/10 flex items-center justify-around px-2 safe-area-pb">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.label}
            to={item.href}
            aria-label={item.label}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-3 rounded-xl transition-all duration-200 flex-1",
              isActive
                ? "text-deckly-primary"
                : "text-slate-500 hover:text-white",
            )}
          >
            <item.icon
              size={22}
              className={cn(
                "transition-transform duration-200",
                isActive && "scale-110",
              )}
            />
            {isActive && (
              <div className="w-1 h-1 bg-deckly-primary rounded-full mt-1" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
