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
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Content", href: "/content" },
  { icon: Monitor, label: "Rooms", href: "/rooms" },
  { icon: BarChart3, label: "Analytics", href: "/analytics", disabled: true },
  { icon: Mail, label: "Inbox", href: "/inbox", disabled: true },
  { icon: MessageCircle, label: "Requests", href: "/requests", disabled: true },
];

export function BottomNav() {
  const location = useLocation();
  const { profile } = useAuth();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleDisabledClick = (label: string) => {
    setActiveTooltip(label);
    setTimeout(() => setActiveTooltip(null), 2000);
  };

  return (
    <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-[#121212]/90 backdrop-blur-xl border border-white/10 flex items-center justify-around px-2 py-2 rounded-2xl shadow-2xl safe-area-pb">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;

        if (item.disabled) {
          return (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center p-2 rounded-xl flex-1 relative"
            >
              <button
                onClick={() => handleDisabledClick(item.label)}
                className="flex flex-col items-center justify-center w-full h-full opacity-20 grayscale cursor-default"
              >
                <item.icon size={20} />
              </button>

              <AnimatePresence>
                {activeTooltip === item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full mb-3 px-3 py-1.5 bg-deckly-primary text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl pointer-events-none whitespace-nowrap"
                  >
                    Coming Soon
                    {/* Tiny arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-deckly-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }

        return (
          <Link
            key={item.label}
            to={item.href}
            aria-label={item.label}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 flex-1 relative",
              isActive
                ? "text-deckly-primary"
                : "text-slate-500 hover:text-white",
            )}
          >
            <item.icon
              size={20}
              className={cn(
                "transition-transform duration-200",
                isActive && "scale-110",
              )}
            />
            {isActive && (
              <motion.div
                layoutId="bottom-nav-active"
                className="absolute -bottom-1 w-1 h-1 bg-deckly-primary rounded-full"
              />
            )}
          </Link>
        );
      })}

      {/* User Profile Icon */}
      <div className="flex flex-col items-center justify-center py-2 px-3 rounded-xl flex-1 relative">
        <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-[10px]">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
