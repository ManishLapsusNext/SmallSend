import React, { useState } from "react";
import { cn } from "../../utils/cn";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const mockData = [55, 48, 18, 40, 40, 40, 40];

export function AnalyticsChart() {
  const [activeTab, setActiveTab] = useState("VISITS");

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center justify-center p-6 gap-4">
        {["VISITS", "TIME SPEND", "BOOKMARKED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-8 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all border",
              activeTab === tab
                ? "bg-deckly-primary text-white border-deckly-primary shadow-lg shadow-deckly-primary/20"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-8 flex flex-col justify-end">
        <div className="relative h-64 w-full flex items-end justify-between px-4 pb-2 border-l border-b border-slate-400">
          {/* Y-Axis mock labels */}
          <div className="absolute -left-6 bottom-0 top-0 flex flex-col justify-between text-[10px] text-slate-500 py-2">
            <span>60</span>
            <span>50</span>
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>

          {mockData.map((val, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-4 w-12 group"
            >
              <div
                className="w-8 bg-[#121212] rounded-full transition-all group-hover:bg-deckly-primary"
                style={{ height: `${(val / 60) * 100}%` }}
              ></div>
              <span className="text-[10px] font-bold text-slate-500">
                {days[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
