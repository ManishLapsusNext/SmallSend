import {
  LayoutDashboard,
  FileText,
  Monitor,
  BarChart3,
  Mail,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import penguinMascot from "../../assets/penguine.png";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { BrandingSettings } from "../../types";
import { deckService } from "../../services/deckService";
import { MascotSettingsModal } from "../dashboard/MascotSettingsModal";
import { Settings } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Content", href: "/content" },
  { icon: Monitor, label: "Rooms", href: "/rooms" },
  { icon: BarChart3, label: "Analytics", href: "/analytics", disabled: true },
  { icon: Mail, label: "Inbox", href: "/inbox", disabled: true },
  { icon: MessageCircle, label: "Requests", href: "/requests", disabled: true },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut, session } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      deckService.getBrandingSettings(session.user.id).then(setBranding);
    }
  }, [session?.user?.id]);

  return (
    <aside className="w-64 bg-[#121212] flex flex-col h-screen border-r border-white/5 shrink-0">
      {/* Brand/Mascot */}
      <div className="p-6">
        <div
          onClick={() => setShowSettings(true)}
          className="relative w-full aspect-square bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden mb-8 group cursor-pointer"
        >
          <img
            src={branding?.logo_url || penguinMascot}
            alt="Deckly Mascot"
            className="w-full h-full object-contain p-4 transition-all group-hover:scale-105 group-hover:opacity-50"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-deckly-primary p-2 rounded-lg shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform">
              <Settings size={18} className="text-slate-950" />
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const content = (
              <>
                <item.icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-deckly-primary"
                      : "text-slate-500 " +
                          (!item.disabled ? "group-hover:text-white" : ""),
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.disabled && (
                  <span className="text-[8px] font-black bg-white/5 text-slate-500 border border-white/5 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    COMING SOON
                  </span>
                )}
              </>
            );

            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium opacity-40 grayscale cursor-not-allowed",
                    "text-slate-500",
                  )}
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                  isActive
                    ? "bg-deckly-primary/10 text-deckly-primary"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Bottom */}
      <div className="mt-auto p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.full_name || "User Name"}
              </p>
              {(() => {
                const t = profile?.tier || "FREE";
                return (
                  <span
                    className={cn(
                      "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 leading-none",
                      t === "PRO_PLUS"
                        ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/20"
                        : t === "PRO"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          : "bg-white/5 text-slate-500 border border-white/5",
                    )}
                  >
                    {t === "PRO_PLUS" ? "PRO+" : t}
                  </span>
                );
              })()}
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black truncate">
              {session?.user?.email?.split("@")[0] || "Founder"}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <MascotSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        branding={branding}
        onUpdate={(newBranding) => setBranding(newBranding)}
      />
    </aside>
  );
}
