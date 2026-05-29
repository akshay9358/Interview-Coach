"use client";

import React, { useMemo, useState } from "react";

interface HeatmapProps {
  activityLog: Record<string, number>;
}

export default function Heatmap({ activityLog }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    visible: boolean;
  }>({ text: "", x: 0, y: 0, visible: false });

  // Generate calendar grid for the last 53 weeks (371 days) ending exactly on this week's Saturday
  const calendarGrid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the end date: Saturday of this week
    const endDate = new Date(today);
    const endDay = endDate.getDay();
    endDate.setDate(today.getDate() + (6 - endDay)); // Shift forward to Saturday
    
    // Find the starting date: exactly 371 days (53 weeks * 7 days) before Saturday (which will be a Sunday)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 370);

    const toLocalYYYYMMDD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const weeks = [];
    let currentDay = new Date(startDate);

    for (let w = 0; w < 53; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dateString = toLocalYYYYMMDD(currentDay);
        const count = activityLog[dateString] || 0;
        
        days.push({
          date: new Date(currentDay),
          dateStr: dateString,
          count
        });
        
        currentDay.setDate(currentDay.getDate() + 1);
      }
      weeks.push(days);
    }
    return weeks;
  }, [activityLog]);

  // Color mapper based on the solve count
  const getCellColor = (count: number) => {
    if (count === 0) return "bg-zinc-900 border border-white/[0.02]";
    if (count === 1) return "bg-emerald-600/40 text-emerald-100 hover:scale-110 shadow-lg shadow-emerald-600/10";
    if (count === 2) return "bg-emerald-500/70 text-emerald-50 hover:scale-110 shadow-lg shadow-emerald-500/20";
    if (count === 3) return "bg-violet-600/80 text-violet-100 hover:scale-110 shadow-lg shadow-violet-600/30";
    return "bg-gradient-to-tr from-fuchsia-500 to-violet-500 text-white hover:scale-115 shadow-xl shadow-fuchsia-500/40 border border-fuchsia-400/20";
  };

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>, 
    dateStr: string, 
    count: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      const formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      
      setTooltip({
        text: `${count === 0 ? "No solves" : `${count} problem${count > 1 ? "s" : ""}`} on ${formattedDate}`,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 38,
        visible: true
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Month labels for columns
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    
    calendarGrid.forEach((week, wIndex) => {
      const midWeekDate = week[3].date; // Use Wednesday of the week
      const currentMonth = midWeekDate.getMonth();
      if (currentMonth !== lastMonth) {
        labels.push({
          text: midWeekDate.toLocaleDateString("en-US", { month: "short" }),
          colIndex: wIndex
        });
        lastMonth = currentMonth;
      }
    });
    
    return labels;
  }, [calendarGrid]);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="relative p-6 rounded-2xl border border-white/5 bg-zinc-950/40 backdrop-blur-md overflow-x-auto w-full select-none">
      <div className="min-w-[760px] relative">
        {/* Month Row */}
        <div className="flex text-[10px] text-zinc-500 font-semibold mb-2 ml-8 h-4 relative">
          {monthLabels.map((lbl, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{ left: `${lbl.colIndex * 13.8}px` }}
            >
              {lbl.text}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-[3.5px]">
          {/* Day Names column */}
          <div className="flex flex-col gap-[3.5px] text-[9px] text-zinc-500 font-medium justify-between pr-2 w-8 text-right h-[87px]">
            <span>{daysOfWeek[0]}</span>
            <span>{daysOfWeek[2]}</span>
            <span>{daysOfWeek[4]}</span>
            <span>{daysOfWeek[6]}</span>
          </div>

          {/* Grid columns (weeks) */}
          <div className="flex gap-[3.5px] h-[87px]">
            {calendarGrid.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3.5px] justify-between">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    onMouseEnter={(e) => handleMouseEnter(e, day.dateStr, day.count)}
                    onMouseLeave={handleMouseLeave}
                    className={`h-2.5 w-2.5 rounded-[2px] transition-all duration-150 cursor-pointer ${getCellColor(
                      day.count
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-zinc-500 mt-4 px-2">
          <span>{Object.values(activityLog).reduce((a,b)=>a+b, 0)} solves in the last year</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="h-2.5 w-2.5 rounded-[2px] bg-zinc-900 border border-white/[0.02]" />
            <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-600/40" />
            <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500/70" />
            <div className="h-2.5 w-2.5 rounded-[2px] bg-violet-600/80" />
            <div className="h-2.5 w-2.5 rounded-[2px] bg-gradient-to-tr from-fuchsia-500 to-violet-500" />
            <span>More</span>
          </div>
        </div>

        {/* Floating Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute z-30 px-2.5 py-1.5 text-[10px] font-medium bg-zinc-900/95 border border-white/10 text-white rounded-lg pointer-events-none shadow-xl backdrop-blur-sm -translate-x-1/2 whitespace-nowrap transition-all duration-75"
            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}
