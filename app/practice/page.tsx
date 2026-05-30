"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Code, 
  ExternalLink, 
  CheckCircle, 
  RefreshCw, 
  Circle, 
  Award, 
  Search, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { 
  getLoggedInUser, 
  getUserProfile, 
  recordSolve, 
  UserProfile 
} from "@/lib/db";
import { standardProblems, fetchCodeforcesStatus, fetchCodeforcesProblemset, PracticeProblem } from "@/lib/apiSync";

export default function PracticeTracker() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | "DSA" | "CP">("All");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Solved" | "Unsolved">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<{ id: string; text: string; error: boolean } | null>(null);
  const [dynamicProblems, setDynamicProblems] = useState<PracticeProblem[]>([]);
  const [customProblems, setCustomProblems] = useState<PracticeProblem[]>([]);
  const [loadingCf, setLoadingCf] = useState(false);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setProfile(getUserProfile(user));
    }

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ic_custom_problems");
      if (saved) {
        setCustomProblems(JSON.parse(saved));
      }
    }

    const handleUpdate = () => {
      if (user) {
        setProfile(getUserProfile(user));
      }
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("ic_custom_problems");
        if (saved) {
          setCustomProblems(JSON.parse(saved));
        }
      }
    };

    window.addEventListener("profile_updated", handleUpdate);

    const loadRecentCFProblems = async () => {
      setLoadingCf(true);
      try {
        const cfProbs = await fetchCodeforcesProblemset();
        // Take the 50 most recent Codeforces problems
        const recentCf = cfProbs.slice(0, 50).map((prob) => ({
          id: `cf-${prob.contestId}-${prob.index.toLowerCase()}`,
          title: prob.name,
          platform: "Codeforces" as const,
          category: "CP" as const,
          difficulty: (prob.rating 
            ? (prob.rating < 1200 ? "Easy" : prob.rating < 1600 ? "Medium" : "Hard")
            : "Medium") as "Easy" | "Medium" | "Hard",
          problemUrl: `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`,
          problemCode: `${prob.contestId}${prob.index}`
        }));
        setDynamicProblems(recentCf);
      } catch (err) {
        console.error("Failed to load dynamic CF problems", err);
      } finally {
        setLoadingCf(false);
      }
    };
    loadRecentCFProblems();

    return () => {
      window.removeEventListener("profile_updated", handleUpdate);
    };
  }, []);

  const handleManualSolve = (problemId: string) => {
    if (!profile) return;
    recordSolve(profile.username, "problem", problemId);
    setProfile(getUserProfile(profile.username));
  };

  const handleDifficultyClick = (diff: "Easy" | "Medium" | "Hard") => {
    if (difficultyFilter === diff) {
      setDifficultyFilter("All");
    } else {
      setDifficultyFilter(diff);
    }
  };

  const handleVerifyCodeforces = async (problem: PracticeProblem) => {
    if (!profile) return;
    if (!profile.cfHandle) {
      setVerifyMessage({
        id: problem.id,
        text: "Please sync your Codeforces handle in the Dashboard first!",
        error: true
      });
      return;
    }

    setVerifyingId(problem.id);
    setVerifyMessage(null);

    try {
      const cfStatus = await fetchCodeforcesStatus(profile.cfHandle);
      const isSolved = cfStatus.solvedProblemCodes.includes(problem.problemCode || "");
      
      if (isSolved) {
        recordSolve(profile.username, "problem", problem.id);
        setProfile(getUserProfile(profile.username));
        setVerifyMessage({
          id: problem.id,
          text: `Verified! You solved ${problem.title} on Codeforces. XP awarded!`,
          error: false
        });
      } else {
        setVerifyMessage({
          id: problem.id,
          text: `No AC submission found for code "${problem.problemCode}" on Codeforces under handle "${profile.cfHandle}". Make sure it is submitted!`,
          error: true
        });
      }
    } catch (err: any) {
      setVerifyMessage({
        id: problem.id,
        text: `Error contacting Codeforces API: ${err.message || "Unknown error"}`,
        error: true
      });
    } finally {
      setVerifyingId(null);
    }
  };

  if (!profile) return null;

  const allProblems = [...standardProblems, ...dynamicProblems, ...customProblems];

  // Calculate counts w.r.t active category (tab) & difficulty
  const baseFiltered = allProblems.filter(problem => {
    const matchesTab = activeTab === "All" || problem.category === activeTab;
    const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter;
    return matchesTab && matchesDifficulty;
  });

  const totalCount = baseFiltered.length;
  const solvedCount = baseFiltered.filter(p => profile.solvedList.includes(p.id)).length;
  const unsolvedCount = totalCount - solvedCount;

  // Filter problems for display
  const filteredProblems = allProblems.filter(problem => {
    const matchesTab = activeTab === "All" || problem.category === activeTab;
    const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter;
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          problem.platform.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isSolved = profile.solvedList.includes(problem.id);
    const matchesStatus = statusFilter === "All" 
      ? true 
      : statusFilter === "Solved" 
        ? isSolved 
        : !isSolved;

    return matchesTab && matchesDifficulty && matchesSearch && matchesStatus;
  });

  const getDifficultyStyles = (diff: string) => {
    switch (diff) {
      case "Easy": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "Medium": return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "Hard": return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default: return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content pane */}
      <main className="flex-1 lg:pl-72 pl-0 min-h-screen flex flex-col bg-zinc-950 pb-12">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between lg:px-8 px-4 pl-16 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Problems Practice Suite
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Solve standard interview tracks and synchronize platform submissions.</p>
          </div>
        </header>

        {/* Dashboard inner details */}
        <div className="lg:p-8 p-4 space-y-8 max-w-6xl w-full mx-auto">
          {/* Top Filter and Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/40 p-4 sm:p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
            {/* Platform categories */}
            <div className="flex gap-1 bg-black/60 p-1.5 rounded-xl border border-white/5 w-full md:w-auto shrink-0">
              {(["All", "DSA", "CP"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold select-none flex-1 md:flex-none transition-all ${
                    activeTab === tab
                      ? "bg-zinc-900 text-white shadow-inner border border-white/5"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {tab === "All" ? "All Tracks" : tab === "DSA" ? "DSA (LeetCode)" : "CP (Codeforces)"}
                </button>
              ))}
            </div>

            {/* Platform status and difficulty filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Status Filter */}
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 mr-1">
                {(["All", "Solved", "Unsolved"] as const).map(status => {
                  const count = status === "All" ? totalCount : status === "Solved" ? solvedCount : unsolvedCount;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold select-none transition-all flex items-center gap-1.5 ${
                        statusFilter === status
                          ? "bg-violet-600 text-white shadow-inner"
                          : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      <span>{status}</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                        statusFilter === status ? "bg-white/20 text-white" : "bg-white/[0.04] text-zinc-400"
                      }`}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {(["Easy", "Medium", "Hard"] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => handleDifficultyClick(diff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    difficultyFilter === diff
                      ? "bg-violet-600/10 border-violet-500/30 text-violet-400"
                      : "bg-black/20 border-white/5 text-zinc-500 hover:text-white"
                  }`}
                >
                  {diff}
                </button>
              ))}

              {/* Search query input */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problem..."
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-white/5 bg-black/40 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sync Stats Banner */}
          {profile.cfHandle && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-violet-500/10 bg-violet-500/[0.02] text-xs text-violet-300">
              <Sparkles className="h-4.5 w-4.5 text-violet-400 shrink-0 fill-current" />
              <span>
                Codeforces handle <strong className="text-white">{profile.cfHandle}</strong> is active! Codeforces problems below can be automatically validated via public API submissions checker.
              </span>
            </div>
          )}

          {/* Practice List grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredProblems.length === 0 ? (
              <div className="p-16 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center">
                <HelpCircle className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-500">No problems found matching this filter combo.</p>
              </div>
            ) : (
              filteredProblems.map(prob => {
                const isSolved = profile.solvedList.includes(prob.id);
                return (
                  <div
                    key={prob.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      isSolved
                        ? "bg-emerald-950/[0.04] border-emerald-500/10 hover:border-emerald-500/20"
                        : "bg-zinc-900/20 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Left: Checkbox & Meta Info */}
                    <div className="flex gap-4 items-center">
                      <button
                        onClick={() => handleManualSolve(prob.id)}
                        disabled={isSolved}
                        className={`shrink-0 transition-colors ${
                          isSolved ? "text-emerald-500 pointer-events-none" : "text-zinc-600 hover:text-emerald-400"
                        }`}
                      >
                        {isSolved ? (
                          <CheckCircle className="h-6 w-6 fill-emerald-500/10" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </button>
                      
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`font-bold text-sm leading-none ${isSolved ? "text-zinc-400 line-through" : "text-white"}`}>
                            {prob.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getDifficultyStyles(prob.difficulty)}`}>
                            {prob.difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-white/[0.03] border border-white/5 text-zinc-500 uppercase tracking-widest">
                            {prob.platform}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1.5 font-medium">
                          Track: {prob.category === "DSA" ? "Data Structures & Algorithms" : "Competitive Programming"}
                          {prob.problemCode && ` • Problem ID: ${prob.problemCode}`}
                        </p>
                      </div>
                    </div>

                    {/* Right: Problem URLs and Verifiers */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                      {/* External Link */}
                      <a
                        href={prob.problemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-1.5 font-semibold"
                      >
                        <span>Solve Problem</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      {/* Codeforces Live API Verifier */}
                      {prob.platform === "Codeforces" && !isSolved && (
                        <button
                          onClick={() => handleVerifyCodeforces(prob)}
                          disabled={verifyingId === prob.id}
                          className="px-3.5 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-500 disabled:opacity-50 text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-lg shadow-violet-600/10"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${verifyingId === prob.id ? "animate-spin" : ""}`} />
                          <span>Verify Sub</span>
                        </button>
                      )}

                      {/* Manual Solved Indicator */}
                      {!isSolved && prob.platform !== "Codeforces" && (
                        <button
                          onClick={() => handleManualSolve(prob.id)}
                          className="px-3.5 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-xs text-emerald-400 transition-all font-semibold"
                        >
                          Mark Solved
                        </button>
                      )}

                      {isSolved && (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-semibold flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 fill-current" />
                          <span>+20 XP Received</span>
                        </span>
                      )}
                    </div>

                    {/* Conditional validation notification messages */}
                    {verifyMessage && verifyMessage.id === prob.id && (
                      <div className={`w-full mt-3 p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
                        verifyMessage.error
                          ? "border-red-500/20 bg-red-500/5 text-red-400"
                          : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                      }`}>
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{verifyMessage.text}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
