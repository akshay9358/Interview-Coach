"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Flame,
  Award,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Zap
} from "lucide-react";
import { getLoggedInUser, getUserProfile, UserProfile } from "@/lib/db";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function AnalyticsDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getLoggedInUser();
    if (user) {
      setProfile(getUserProfile(user));
    }
  }, []);

  if (!profile) return null;

  // 1. Calculate category distribution
  const dsaSolved = profile.solvedList.filter(id => id.startsWith("lc-")).length;
  const cpSolved = profile.solvedList.filter(id => id.startsWith("cf-")).length;
  const sqlSolved = profile.solvedSql.length;
  const puzzlesSolved = profile.solvedPuzzles.length;
  const customSolved = profile.solvedCustomCount;

  const distributionData = [
    { name: "DSA (LeetCode)", value: dsaSolved, color: "#3b82f6" },
    { name: "CP (Codeforces)", value: cpSolved, color: "#10b981" },
    { name: "SQL practice", value: sqlSolved, color: "#8b5cf6" },
    { name: "Logical puzzles", value: puzzlesSolved, color: "#f97316" },
    { name: "Custom logged", value: customSolved, color: "#6b7280" }
  ].filter(item => item.value > 0); // Only show topics that have at least one solve

  // Default mock data if no solves exist yet
  const displayDistribution = distributionData.length > 0 ? distributionData : [
    { name: "DSA (LeetCode)", value: 2, color: "#3b82f6" },
    { name: "CP (Codeforces)", value: 1, color: "#10b981" },
    { name: "SQL practice", value: 1, color: "#8b5cf6" },
    { name: "Logical puzzles", value: 1, color: "#f97316" }
  ];

  // 2. Prepare past 7 days activity trend data
  const activityTrend = (() => {
    const trend = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = profile.activityLog[dateStr] || 0;

      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

      trend.push({
        day: dayLabel,
        date: dateStr,
        Solves: count
      });
    }
    return trend;
  })();

  const totalSolved = dsaSolved + cpSolved + sqlSolved + puzzlesSolved + customSolved;

  const timedSessions = profile.timedSessions || [];
  const totalTimedCount = timedSessions.length;
  const avgTimedSec = totalTimedCount > 0
    ? Math.round(timedSessions.reduce((sum, s) => sum + s.timeSpentSeconds, 0) / totalTimedCount)
    : 0;
  const fastestTimedSec = totalTimedCount > 0
    ? Math.min(...timedSessions.map(s => s.timeSpentSeconds))
    : 0;

  const formatReadableTime = (secs: number) => {
    if (secs === 0) return "--";
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main analytics view */}
      <main className="flex-1 pl-72 min-h-screen flex flex-col bg-zinc-950 pb-12">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Performance Analytics
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Visualize your technical progress, streak history, and topic coverage.</p>
          </div>
        </header>

        {/* Analytics details */}
        <div className="p-8 space-y-8 max-w-6xl w-full mx-auto">

          {/* Top Row Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Gamification stats 1: Total solved */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-600/10 rounded-full blur-xl" />
              <div className="flex justify-between items-center mb-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <span>Total Practiced</span>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-4xl font-extrabold text-white">{totalSolved}</span>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium">Accumulated across all practice tracks</p>
            </div>

            {/* Streak card */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-orange-600/10 rounded-full blur-xl" />
              <div className="flex justify-between items-center mb-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <span>Current Streak</span>
                <Flame className="h-5 w-5 text-orange-500 fill-current animate-pulse" />
              </div>
              <span className="text-4xl font-extrabold text-white">{profile.streak}</span>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium">Keep solving daily to protect your streak!</p>
            </div>

            {/* Total XP Score */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-yellow-600/10 rounded-full blur-xl" />
              <div className="flex justify-between items-center mb-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <span>Accrued XP Score</span>
                <Award className="h-5 w-5 text-yellow-500 fill-current" />
              </div>
              <span className="text-4xl font-extrabold text-white">{profile.xp}</span>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium">Practice tasks earn XP and raise levels</p>
            </div>
          </div>

          {/* Timed Practice & Speed Analytics Row */}
          {totalTimedCount > 0 && (
            <div className="space-y-3 animate-fadeIn">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-violet-400" />
                Solve Speed Metrics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Timed Solves Count */}
                <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950/60 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-violet-600/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-center mb-2.5 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                    <span>Timed Practiced</span>
                    <Zap className="h-4 w-4 text-violet-400 fill-current animate-pulse" />
                  </div>
                  <span className="text-2xl font-extrabold text-white">{totalTimedCount} solves</span>
                  <p className="text-[9px] text-zinc-500 mt-1.5 font-medium">Problems practiced with live stopwatch tracking</p>
                </div>

                {/* Average Speed */}
                <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950/60 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-600/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-center mb-2.5 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                    <span>Average Speed</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-extrabold text-emerald-400">{formatReadableTime(avgTimedSec)}</span>
                  <p className="text-[9px] text-zinc-500 mt-1.5 font-medium">Average solve duration across all platforms</p>
                </div>

                {/* Fastest Speed */}
                <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950/60 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-amber-600/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-center mb-2.5 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                    <span>Fastest Solve</span>
                    <Award className="h-4 w-4 text-amber-400 fill-current" />
                  </div>
                  <span className="text-2xl font-extrabold text-amber-400">{formatReadableTime(fastestTimedSec)}</span>
                  <p className="text-[9px] text-zinc-500 mt-1.5 font-medium">Your fastest logged stopwatch performance</p>
                </div>
              </div>
            </div>
          )}

          {/* Core Analytics Grid: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Chart: Weekly Solve Trend (Area Chart, col-span-7) */}
            <div className="lg:col-span-7 p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-violet-400" />
                  7-Day Practice Trend
                </h3>
                <p className="text-xs text-zinc-500 mb-6">Track your daily solve progression over the past week.</p>
              </div>

              {/* Responsive Container for Recharts (Rendered only client-side when mounted) */}
              <div className="h-64 w-full text-xs font-semibold">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSolves" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#52525b" tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" tickLine={false} axisLine={false} allowDecimals={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#27272a",
                          borderRadius: "12px",
                          color: "#fff"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Solves"
                        stroke="#a78bfa"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSolves)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600">
                    Loading chart widgets...
                  </div>
                )}
              </div>
            </div>

            {/* Right Chart: Topic Distribution Pie (col-span-5) */}
            <div className="lg:col-span-5 p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-violet-400" />
                  Topic Mastery Distribution
                </h3>
                <p className="text-xs text-zinc-500 mb-6">Category shares comparing total completed practices.</p>
              </div>

              {/* Pie Chart display */}
              <div className="h-64 w-full flex justify-center items-center font-medium">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {displayDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#27272a",
                          borderRadius: "12px",
                          color: "#fff"
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "10px", color: "#71717a" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600">
                    Loading distribution widgets...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gamification Progress and milestones */}
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-xl">
            <h3 className="text-md font-bold text-white mb-5 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500 fill-current animate-bounce" />
              Practice Mastery Milestones
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Milestone 1 */}
              <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${totalSolved >= 1
                ? "border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-400"
                : "border-white/5 bg-white/[0.01] text-zinc-500"
                }`}>
                <CheckCircle className={`h-6 w-6 shrink-0 ${totalSolved >= 1 ? "fill-emerald-500/10 text-emerald-500" : "text-zinc-700"}`} />
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">First Solve</h4>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Solve your first practice task. (Completed)</span>
                </div>
              </div>

              {/* Milestone 2 */}
              <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${profile.streak >= 5
                ? "border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-400"
                : "border-white/5 bg-white/[0.01] text-zinc-500"
                }`}>
                <Flame className={`h-6 w-6 shrink-0 ${profile.streak >= 5 ? "fill-orange-500/10 text-orange-500" : "text-zinc-700"}`} />
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">Streak Master</h4>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Maintain a 5-day streak. ({profile.streak >= 5 ? "Completed" : "In Progress"})</span>
                </div>
              </div>

              {/* Milestone 3 */}
              <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${profile.xp >= 500
                ? "border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-400"
                : "border-white/5 bg-white/[0.01] text-zinc-500"
                }`}>
                <Award className={`h-6 w-6 shrink-0 ${profile.xp >= 500 ? "fill-yellow-500/10 text-yellow-500" : "text-zinc-700"}`} />
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">Elite Scholar</h4>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Accumulate 500+ XP points. ({profile.xp >= 500 ? "Completed" : `${profile.xp}/500 XP`})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
