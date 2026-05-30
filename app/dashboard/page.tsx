"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Heatmap from "@/components/Heatmap";
import ProgressRing from "@/components/ProgressRing";
import { 
  Flame, 
  Award, 
  CheckCircle, 
  ChevronRight, 
  RefreshCw, 
  Sparkles, 
  UserPlus, 
  BookOpen, 
  Check, 
  Plus,
  Target,
  Shuffle,
  ExternalLink
} from "lucide-react";
import { 
  getLoggedInUser, 
  getUserProfile, 
  saveUserProfile, 
  recordSolve, 
  UserProfile,
  getLocalTodayStr
} from "@/lib/db";
import { fetchCodeforcesStatus, fetchLeetCodeStatus, standardProblems } from "@/lib/apiSync";

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cfInput, setCfInput] = useState("");
  const [lcInput, setLcInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [customSolveTitle, setCustomSolveTitle] = useState("");
  const [customSolveSuccess, setCustomSolveSuccess] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<any | null>(null);

  const rollDailyChallenge = (currentProfile: UserProfile) => {
    const unsolved = standardProblems.filter(p => !currentProfile.solvedList.includes(p.id));
    if (unsolved.length > 0) {
      const randomIndex = Math.floor(Math.random() * unsolved.length);
      setDailyChallenge(unsolved[randomIndex]);
    } else {
      setDailyChallenge(null);
    }
  };

  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      const uProfile = getUserProfile(user);
      setProfile(uProfile);
      setCfInput(uProfile.cfHandle || "");
      setLcInput(uProfile.lcHandle || "");
      rollDailyChallenge(uProfile);
    }
  }, []);

  const handleSyncHandles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSyncing(true);
    setSyncMessage("Synchronizing stats from LeetCode & Codeforces APIs...");

    try {
      let updatedProfile = { ...profile };
      let logsAdded = 0;

      // 1. Sync Codeforces
      if (cfInput.trim()) {
        try {
          const cfData = await fetchCodeforcesStatus(cfInput.trim());
          updatedProfile.cfHandle = cfInput.trim();
          
          // Grant XP bonus for successful syncing!
          if (!profile.cfHandle) {
            updatedProfile.xp += 50; 
          }
          
          // Dynamically verify all tracked Codeforces problems against API results
          const cfProblems = standardProblems.filter(p => p.platform === "Codeforces" && p.problemCode);
          for (const prob of cfProblems) {
            if (cfData.solvedProblemCodes.includes(prob.problemCode!) && !updatedProfile.solvedList.includes(prob.id)) {
              updatedProfile.solvedList.push(prob.id);
              updatedProfile.xp += 20;
              logsAdded++;
            }
          }
        } catch (err: any) {
          console.error("Codeforces Sync Error: ", err);
          throw new Error(`Codeforces Sync failed: ${err.message || "User not found"}`);
        }
      }

      // 2. Sync LeetCode
      if (lcInput.trim()) {
        try {
          const lcData = await fetchLeetCodeStatus(lcInput.trim());
          updatedProfile.lcHandle = lcInput.trim();
          
          // Grant XP bonus for successful syncing!
          if (!profile.lcHandle) {
            updatedProfile.xp += 50;
          }
        } catch (err: any) {
          console.error("LeetCode Sync Error: ", err);
          throw new Error(`LeetCode Sync failed: ${err.message || "User not found"}`);
        }
      }

      // Record any newly matched problems in the activity log today
      if (logsAdded > 0) {
        const todayStr = getLocalTodayStr();
        updatedProfile.activityLog[todayStr] = (updatedProfile.activityLog[todayStr] || 0) + logsAdded;
      }

      saveUserProfile(updatedProfile);
      setProfile(getUserProfile(profile.username));
      setSyncMessage("Stats synced successfully! Practice records updated.");
    } catch (err: any) {
      setSyncMessage(err.message || "Synchronization failed. Please check handles.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !customSolveTitle.trim()) return;

    recordSolve(profile.username, "custom", "custom-solve");
    setProfile(getUserProfile(profile.username));
    setCustomSolveTitle("");
    setCustomSolveSuccess(true);
    setTimeout(() => setCustomSolveSuccess(false), 2000);
  };

  if (!profile) return null;

  // Statistics summaries
  const dsaSolved = profile.solvedList.filter(id => id.startsWith("lc-")).length;
  const cpSolved = profile.solvedList.filter(id => id.startsWith("cf-")).length;
  const sqlSolved = profile.solvedSql.length;
  const puzzlesSolved = profile.solvedPuzzles.length;

  const totalStandardSolved = profile.solvedList.length + sqlSolved + puzzlesSolved;
  const totalSolves = totalStandardSolved + profile.solvedCustomCount;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main dashboard content */}
      <main className="flex-1 lg:pl-72 pl-0 min-h-screen flex flex-col bg-zinc-950 pb-12">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between lg:px-8 px-4 pl-16 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Practice Dashboard
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Welcome back, {profile.username}! Keep up the momentum.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/5 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-400 fill-current" />
              Level {Math.floor(profile.xp / 250) + 1}
            </span>
          </div>
        </header>

        {/* Dash contents container */}
        <div className="p-8 space-y-8 max-w-6xl w-full mx-auto">
          {/* Zero state motivational message */}
          {totalSolves === 0 && (
            <div className="p-5 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-fuchsia-600/5 to-transparent text-sm text-zinc-300 flex items-start gap-4 shadow-xl shadow-violet-600/5 animate-fadeIn">
              <Sparkles className="h-6 w-6 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 space-y-1">
                <strong className="font-bold text-white text-base block">Welcome to Your Technical Interview Prep Suite!</strong>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Your profile starts completely fresh. Start solving DSA problems, competitive programming questions, SQL queries, or logical quant brainteasers to track your progress metrics, secure active streaks, level up your rank, and gain Mastery XP Points!
                </p>
              </div>
            </div>
          )}

          {/* Top Overview Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Day Streak */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-orange-600/10 rounded-full blur-xl group-hover:bg-orange-600/15 transition-all duration-300" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Day Streak</span>
                <Flame className="h-6 w-6 text-orange-500 fill-current animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">{profile.streak}</span>
                <span className="text-zinc-400 text-xs">consecutive days</span>
              </div>
            </div>

            {/* Total Solved */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-600/10 rounded-full blur-xl group-hover:bg-emerald-600/15 transition-all duration-300" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Problems Solved</span>
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">{totalSolves}</span>
                <span className="text-zinc-400 text-xs">solved items</span>
              </div>
            </div>

            {/* Accrued XP */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-yellow-600/10 rounded-full blur-xl group-hover:bg-yellow-600/15 transition-all duration-300" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Mastery Points</span>
                <Award className="h-6 w-6 text-yellow-500 fill-current" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">{profile.xp}</span>
                <span className="text-zinc-400 text-xs">XP Points</span>
              </div>
            </div>

            {/* Level progression */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-violet-600/10 rounded-full blur-xl group-hover:bg-violet-600/15 transition-all duration-300" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Level Progress</span>
                <span className="text-xs text-violet-400 font-bold">Lvl {Math.floor(profile.xp / 250) + 1}</span>
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">{profile.xp % 250} / 250 XP</span>
                  <span className="text-zinc-500">Next Lvl</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 border border-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-500"
                    style={{ width: `${(profile.xp % 250) / 2.5}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sync accounts panel */}
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  Connect LeetCode & Codeforces Accounts
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  We query public APIs in the background to automatically cross-verify solves and sync practice heatmaps!
                </p>
              </div>
            </div>

            <form onSubmit={handleSyncHandles} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest ml-1">
                  Codeforces Handle
                </label>
                <input
                  type="text"
                  value={cfInput}
                  onChange={(e) => setCfInput(e.target.value)}
                  placeholder="e.g. MikeMirzayanov"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest ml-1">
                  LeetCode Handle
                </label>
                <input
                  type="text"
                  value={lcInput}
                  onChange={(e) => setLcInput(e.target.value)}
                  placeholder="e.g. neetcode"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={syncing}
                className="py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 select-none"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                <span>Sync Platform Accounts</span>
              </button>
            </form>

            {syncMessage && (
              <div className="mt-4 p-3 rounded-xl border border-white/5 bg-white/[0.01] text-xs text-violet-300 animate-fadeIn">
                {syncMessage}
              </div>
            )}
          </div>

          {/* Activity Heatmap Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
              Daily Practice Heatmap (365 Days)
            </h3>
            <Heatmap activityLog={profile.activityLog || {}} />
          </div>

          {/* Bottom Grid: Quick Solves & Category Progression */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Focus Challenge Card */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h4 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-400 animate-pulse" />
                  Daily Focus Challenge
                </h4>
                <p className="text-[11px] text-zinc-500 mb-5 leading-relaxed">
                  Keep your momentum high! Attempt this handpicked unsolved coding challenge to secure your streak and boost XP.
                </p>

                {dailyChallenge ? (
                  <div className="space-y-4 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">RECOMMENDED TASK</span>
                      <h5 className="font-extrabold text-sm text-white line-clamp-2 leading-snug">
                        {dailyChallenge.title}
                      </h5>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        dailyChallenge.difficulty === "Easy"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : dailyChallenge.difficulty === "Medium"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}>
                        {dailyChallenge.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        {dailyChallenge.category === "DSA" ? "DSA" : "CP"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 uppercase tracking-wider">
                        +20 XP
                      </span>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <a
                        href={dailyChallenge.problemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/15"
                      >
                        <span>Solve Problem</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => rollDailyChallenge(profile)}
                        className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
                        title="Roll another challenge"
                      >
                        <Shuffle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center border border-dashed border-emerald-500/10 bg-emerald-500/[0.02] rounded-xl flex flex-col items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mb-2 fill-emerald-500/10" />
                    <h5 className="text-xs font-bold text-white mb-1">Mastery Achieved!</h5>
                    <p className="text-[10px] text-zinc-500">All standard DSA & CP problems are solved. Amazing work!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category progression rings */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md">
              <h4 className="text-md font-bold text-white mb-5 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-violet-400" />
                Category Mastery Targets
              </h4>

              {(() => {
                const getDynamicTarget = (solved: number, base: number) => {
                  const multiplier = Math.floor(solved / base) + 1;
                  return multiplier * base;
                };

                const dsaTarget = getDynamicTarget(dsaSolved, 15);
                const cpTarget = getDynamicTarget(cpSolved, 15);
                const sqlTarget = getDynamicTarget(sqlSolved, 5);
                const puzzlesTarget = getDynamicTarget(puzzlesSolved, 5);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* DSA */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.01] border border-white/5 text-center">
                      <ProgressRing
                        id="dsa"
                        progress={dsaSolved / dsaTarget}
                        size={80}
                        strokeWidth={6}
                        gradientColors={{ start: "#3b82f6", end: "#6366f1" }}
                      />
                      <span className="text-xs font-semibold text-white mt-3">DSA</span>
                      <span className="text-[10px] text-zinc-500 mt-1">{dsaSolved}/{dsaTarget} Solved</span>
                    </div>

                    {/* CP */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.01] border border-white/5 text-center">
                      <ProgressRing
                        id="cp"
                        progress={cpSolved / cpTarget}
                        size={80}
                        strokeWidth={6}
                        gradientColors={{ start: "#10b981", end: "#14b8a6" }}
                      />
                      <span className="text-xs font-semibold text-white mt-3">CP</span>
                      <span className="text-[10px] text-zinc-500 mt-1">{cpSolved}/{cpTarget} Solved</span>
                    </div>

                    {/* SQL */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.01] border border-white/5 text-center">
                      <ProgressRing
                        id="sql"
                        progress={sqlSolved / sqlTarget}
                        size={80}
                        strokeWidth={6}
                        gradientColors={{ start: "#8b5cf6", end: "#d946ef" }}
                      />
                      <span className="text-xs font-semibold text-white mt-3">SQL Practice</span>
                      <span className="text-[10px] text-zinc-500 mt-1">{sqlSolved}/{sqlTarget} Solved</span>
                    </div>

                    {/* Puzzles */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.01] border border-white/5 text-center">
                      <ProgressRing
                        id="puzzles"
                        progress={puzzlesSolved / puzzlesTarget}
                        size={80}
                        strokeWidth={6}
                        gradientColors={{ start: "#f97316", end: "#f59e0b" }}
                      />
                      <span className="text-xs font-semibold text-white mt-3">Puzzles</span>
                      <span className="text-[10px] text-zinc-500 mt-1">{puzzlesSolved}/{puzzlesTarget} Solved</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
