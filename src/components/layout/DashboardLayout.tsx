import React from "react";
import { Sidebar } from "./Sidebar";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showFab?: boolean;
}

export function DashboardLayout({
  children,
  title = "Dashboard",
  showFab = true,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 shrink-0">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

          <div className="flex items-center gap-4">
            {/* Founder Mode Toggle Mockup */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                Founder Mode
              </span>
              <div className="w-8 h-4 bg-deckly-primary rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8F9FA]">
          <div className="max-w-full px-4 md:px-12 mx-auto">{children}</div>
        </div>

        {/* Floating Action Button */}
        {showFab && (
          <Link
            to="/upload"
            className="fixed bottom-10 right-10 w-16 h-16 bg-deckly-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-deckly-primary/40 hover:scale-110 active:scale-95 transition-all z-[100] group"
          >
            <Plus
              size={32}
              strokeWidth={3}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
          </Link>
        )}
      </main>
    </div>
  );
}
