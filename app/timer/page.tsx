"use client";

import React, { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  TrendingUp,
  Award,
  Clock,
  Zap,
  BarChart3,
  HelpCircle,
  CheckCircle,
  ExternalLink,
  Plus,
  AlertCircle,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  getLoggedInUser,
  getUserProfile,
  recordTimedSession,
  recordSolve,
  UserProfile,
  TimedSession
} from "@/lib/db";
import {
  fetchCodeforcesProblemset,
  fetchRecentCFSubmissions,
  fetchCodeforcesStatus,
  CodeforcesProblem,
  CodeforcesSubmission,
  standardProblems
} from "@/lib/apiSync";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from "recharts";

export default function TimedPracticePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  // Stopwatch state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds

  // Problem Form state
  const [problemTitle, setProblemTitle] = useState("");
  const [problemLink, setProblemLink] = useState("");
  const [platform, setPlatform] = useState<TimedSession["platform"]>("LeetCode");
  const [difficulty, setDifficulty] = useState<TimedSession["difficulty"]>("Medium");

  // Codeforces Explorer state
  const [cfProblems, setCfProblems] = useState<CodeforcesProblem[]>([]);
  const [cfProblemsLoading, setCfProblemsLoading] = useState(false);
  const [cfProblemsError, setCfProblemsError] = useState<string | null>(null);
  const [selectedCfLevel, setSelectedCfLevel] = useState("A");
  const [cfSearchQuery, setCfSearchQuery] = useState("");
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [showSolvedInExplorer, setShowSolvedInExplorer] = useState(false);
  const [cfSolvedCodes, setCfSolvedCodes] = useState<Set<string>>(new Set());
  const [cfHistoricalLoading, setCfHistoricalLoading] = useState(false);
  const [contestMap, setContestMap] = useState<Map<number, string>>(new Map());
  const [revealedTags, setRevealedTags] = useState<Set<string>>(new Set());

  const toggleRevealTags = (probCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedTags((prev) => {
      const next = new Set(prev);
      if (next.has(probCode)) {
        next.delete(probCode);
      } else {
        next.add(probCode);
      }
      return next;
    });
  };

  // Auto-Solve State
  const [autoSolveStatus, setAutoSolveStatus] = useState("");
  const [autoSolveSuccessMessage, setAutoSolveSuccessMessage] = useState<string | null>(null);

  // Storage keys for active timer persistence
  const STORAGE_KEYS = {
    ACTIVE_TIMER: "ic_active_timer"
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate profile and restore active timer if any
  useEffect(() => {
    setMounted(true);
    const user = getLoggedInUser();
    if (user) {
      setProfile(getUserProfile(user));
    }

    // Hydrate running timer from localStorage
    const savedTimer = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
    if (savedTimer) {
      try {
        const {
          title,
          link,
          plat,
          diff,
          startTime,
          accumulatedTime,
          running
        } = JSON.parse(savedTimer);

        setProblemTitle(title || "");
        setProblemLink(link || "");
        setPlatform(plat || "LeetCode");
        setDifficulty(diff || "Medium");

        if (running && startTime) {
          const secondsPassed = Math.floor((Date.now() - startTime) / 1000) + accumulatedTime;
          setTimeElapsed(secondsPassed);
          setIsTimerRunning(true);
        } else {
          setTimeElapsed(accumulatedTime || 0);
          setIsTimerRunning(false);
        }
      } catch (e) {
        console.error("Error restoring saved timer", e);
      }
    }

    const savedLevel = localStorage.getItem("ic_cf_selected_level");
    if (savedLevel && ["A", "B", "C", "D", "E", "F", "G"].includes(savedLevel)) {
      setSelectedCfLevel(savedLevel);
    }
  }, []);

  // Update timer tick
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Load Codeforces Problemset and Contests on mount
  useEffect(() => {
    const loadCfProblemsAndContests = async () => {
      setCfProblemsLoading(true);
      setCfProblemsError(null);
      try {
        // 1. Try to load from localStorage cache first to avoid re-fetching!
        const cachedProbs = localStorage.getItem("ic_cf_cached_problems");
        const cachedMap = localStorage.getItem("ic_cf_cached_contest_map");
        const cacheTime = localStorage.getItem("ic_cf_cached_time");
        const isCacheValid = cacheTime && (Date.now() - parseInt(cacheTime) < 1800000); // 30 minutes cache validity

        if (cachedProbs && cachedMap && isCacheValid) {
          setCfProblems(JSON.parse(cachedProbs));
          const mapData = JSON.parse(cachedMap);
          setContestMap(new Map(Object.entries(mapData).map(([k, v]) => [parseInt(k), v as string])));
          setCfProblemsLoading(false);
          return;
        }

        // Fetch contests to map Div. 3 and Div. 4
        const cmap = new Map<number, string>();
        try {
          const contestsResponse = await fetch("https://codeforces.com/api/contest.list");
          if (contestsResponse.ok) {
            const contestsData = await contestsResponse.json();
            if (contestsData.status === "OK" && contestsData.result) {
              for (const contest of contestsData.result) {
                cmap.set(contest.id, contest.name);
              }
              setContestMap(cmap);
            }
          }
        } catch (contestErr) {
          console.error("Failed to load Codeforces contests list:", contestErr);
        }

        const probs = await fetchCodeforcesProblemset();
        setCfProblems(probs);

        // Save to cache
        localStorage.setItem("ic_cf_cached_problems", JSON.stringify(probs));
        localStorage.setItem("ic_cf_cached_contest_map", JSON.stringify(Object.fromEntries(cmap)));
        localStorage.setItem("ic_cf_cached_time", Date.now().toString());
      } catch (err: any) {
        setCfProblemsError(err.message || "Failed to load Codeforces problems");
      } finally {
        setCfProblemsLoading(false);
      }
    };
    loadCfProblemsAndContests();
  }, []);

  // Load Codeforces historical solves for tagging
  useEffect(() => {
    const handle = profile?.cfHandle;
    if (!handle) return;

    const loadCFHistoricalSolves = async () => {
      setCfHistoricalLoading(true);
      try {
        const status = await fetchCodeforcesStatus(handle);
        if (status && status.solvedProblemCodes) {
          setCfSolvedCodes(new Set(status.solvedProblemCodes.map(code => code.toUpperCase())));
        }
      } catch (err) {
        console.error("Failed to load Codeforces historical solves:", err);
      } finally {
        setCfHistoricalLoading(false);
      }
    };

    loadCFHistoricalSolves();
  }, [profile?.cfHandle]);

  // Save current timer configuration to localStorage to persist through refreshes
  const updateStoredTimer = (elapsedSec: number, running: boolean) => {
    const savedTimer = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
    let startTime = Date.now();
    let accumulatedTime = elapsedSec;

    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        if (running && parsed.running) {
          startTime = parsed.startTime;
          accumulatedTime = parsed.accumulatedTime;
        } else if (running) {
          startTime = Date.now();
          accumulatedTime = elapsedSec;
        } else {
          accumulatedTime = elapsedSec;
        }
      } catch (e) { }
    }

    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_TIMER,
      JSON.stringify({
        title: problemTitle,
        link: problemLink,
        plat: platform,
        diff: difficulty,
        startTime: running ? startTime : null,
        accumulatedTime: running ? accumulatedTime : elapsedSec,
        running
      })
    );
  };

  // Helper to persist only specific fields to active timer
  const updateStoredFields = (fields: {
    title?: string;
    link?: string;
    plat?: TimedSession["platform"];
    diff?: TimedSession["difficulty"];
  }) => {
    const savedTimer = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
    let startTime = null;
    let accumulatedTime = timeElapsed;
    let running = isTimerRunning;

    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        startTime = parsed.startTime;
        accumulatedTime = parsed.accumulatedTime;
        running = parsed.running;
      } catch (e) {}
    }

    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_TIMER,
      JSON.stringify({
        title: fields.title !== undefined ? fields.title : problemTitle,
        link: fields.link !== undefined ? fields.link : problemLink,
        plat: fields.plat !== undefined ? fields.plat : platform,
        diff: fields.diff !== undefined ? fields.diff : difficulty,
        startTime,
        accumulatedTime,
        running
      })
    );
  };

  const handleTitleChange = (val: string) => {
    setProblemTitle(val);
    updateStoredFields({ title: val });
  };

  const handlePlatformChange = (val: TimedSession["platform"]) => {
    setPlatform(val);
    updateStoredFields({ plat: val });
  };

  const handleDifficultyChange = (val: TimedSession["difficulty"]) => {
    setDifficulty(val);
    updateStoredFields({ diff: val });
  };

  // Background polling for automatic solve detection on Codeforces
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const parseCFLink = (link: string) => {
      const problemsetMatch = link.match(/\/problemset\/problem\/(\d+)\/([A-Z0-9]+)/i);
      if (problemsetMatch) {
        return { contestId: parseInt(problemsetMatch[1]), index: problemsetMatch[2].toUpperCase() };
      }
      const contestMatch = link.match(/\/contest\/(\d+)\/problem\/([A-Z0-9]+)/i);
      if (contestMatch) {
        return { contestId: parseInt(contestMatch[1]), index: contestMatch[2].toUpperCase() };
      }
      const simpleMatch = link.trim().match(/^(\d+)([A-Z0-9]+)$/i);
      if (simpleMatch) {
        return { contestId: parseInt(simpleMatch[1]), index: simpleMatch[2].toUpperCase() };
      }
      return null;
    };

    const runAutoSolvePoll = async (contestId: number, index: string, userHandle: string, startTimeMs: number) => {
      try {
        setAutoSolveStatus("CF Auto-solve: Polling submissions in background...");
        const subs = await fetchRecentCFSubmissions(userHandle, 5);

        // Find matching Accepted submission submitted AFTER the stopwatch started
        const matchingSub = subs.find(sub => {
          const subContestId = sub.problem.contestId || sub.contestId;
          const subIndex = sub.problem.index.toUpperCase();
          const subVerdict = sub.verdict;
          const subTimeMs = sub.creationTimeSeconds * 1000;

          return (
            subContestId === contestId &&
            subIndex === index &&
            subVerdict === "OK" &&
            subTimeMs > startTimeMs
          );
        });

        if (matchingSub) {
          // AUTO-SOLVE SUCCESS TRIGGERED!
          const savedTimer = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
          let finalElapsed = timeElapsed;
          if (savedTimer) {
            try {
              const { startTime, accumulatedTime } = JSON.parse(savedTimer);
              if (startTime) {
                finalElapsed = Math.floor((Date.now() - startTime) / 1000) + accumulatedTime;
              }
            } catch (e) { }
          } else {
            // Fallback if not saved
            finalElapsed = Math.floor((Date.now() - startTimeMs) / 1000);
          }

          if (finalElapsed < 5) finalElapsed = 5; // Enforce minimum timer safety limit

          // Log timed session
          recordTimedSession(profile!.username, {
            title: problemTitle || matchingSub.problem.name || `${contestId}${index}`,
            linkOrId: problemLink || `https://codeforces.com/problemset/problem/${contestId}/${index}`,
            platform: "Codeforces",
            difficulty: matchingSub.problem.rating
              ? (matchingSub.problem.rating < 1200 ? "Easy" : matchingSub.problem.rating < 1600 ? "Medium" : "Hard")
              : difficulty,
            timeSpentSeconds: finalElapsed
          });

          // Also mark solved in standard database lists (+20 XP)
          recordSolve(profile!.username, "problem", `cf-${contestId}-${index.toLowerCase()}`);

          // Clear timer state
          setIsTimerRunning(false);
          setTimeElapsed(0);
          setProblemTitle("");
          setProblemLink("");
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);

          // Display glowing notification
          setAutoSolveSuccessMessage(
            `🎉 Autodetect Solved! Codeforces Accepted submission detected. Stopwatch stopped at ${formatReadableTime(finalElapsed)}! (+30 XP and +20 XP awarded!)`
          );

          // Update local profile state to propagate achievements immediately
          setProfile(getUserProfile(profile!.username));
          setAutoSolveStatus("");

          // Clear success toast after 10 seconds
          setTimeout(() => {
            setAutoSolveSuccessMessage(null);
          }, 10000);
        }
      } catch (e: any) {
        console.error("Auto-solve polling failed:", e);
        setAutoSolveStatus("CF Auto-solve: Submissions fetch failed. Retrying...");
      }
    };

    if (isTimerRunning && platform === "Codeforces" && profile?.cfHandle && problemLink) {
      const userHandle = profile.cfHandle;
      const parsed = parseCFLink(problemLink);
      if (parsed) {
        const { contestId, index } = parsed;

        let startTimeMs = Date.now();
        const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
        if (saved) {
          try {
            const parsedSaved = JSON.parse(saved);
            if (parsedSaved.startTime) {
              startTimeMs = parsedSaved.startTime;
            }
          } catch (e) { }
        }

        // Run immediately
        runAutoSolvePoll(contestId, index, userHandle, startTimeMs);

        // Set interval to poll every 10 seconds
        pollInterval = setInterval(() => {
          runAutoSolvePoll(contestId, index, userHandle, startTimeMs);
        }, 10000);
      } else {
        setAutoSolveStatus("CF Auto-solve: Enter a valid Codeforces problem link or ID (e.g. 4A) to start polling.");
      }
    } else {
      setAutoSolveStatus("");
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isTimerRunning, platform, problemLink, profile?.cfHandle, problemTitle, difficulty]);

  // Smart Platform Auto-Detection based on problem link/ID
  const handleLinkChange = (val: string) => {
    setProblemLink(val);

    const lower = val.toLowerCase();
    
    // Helper to parse Codeforces link or simple code like "4A"
    const parseCFLink = (link: string) => {
      const problemsetMatch = link.match(/\/problemset\/problem\/(\d+)\/([A-Z0-9]+)/i);
      if (problemsetMatch) {
        return { contestId: parseInt(problemsetMatch[1]), index: problemsetMatch[2].toUpperCase() };
      }
      const contestMatch = link.match(/\/contest\/(\d+)\/problem\/([A-Z0-9]+)/i);
      if (contestMatch) {
        return { contestId: parseInt(contestMatch[1]), index: contestMatch[2].toUpperCase() };
      }
      const simpleMatch = link.trim().match(/^(\d+)([A-Z0-9]+)$/i);
      if (simpleMatch) {
        return { contestId: parseInt(simpleMatch[1]), index: simpleMatch[2].toUpperCase() };
      }
      return null;
    };

    let detectedTitle = problemTitle;
    let detectedPlatform = platform;
    let detectedDifficulty = difficulty;

    if (lower.includes("leetcode.com")) {
      detectedPlatform = "LeetCode";
      const slugMatch = val.match(/\/problems\/([^/]+)/);
      if (slugMatch && slugMatch[1]) {
        const slug = slugMatch[1];
        
        // 1. Try finding in standardProblems
        const matchedStd = standardProblems.find(p => p.leetcodeSlug === slug);
        if (matchedStd) {
          detectedTitle = matchedStd.title;
          detectedDifficulty = matchedStd.difficulty;
        } else {
          // Fallback title parsing from slug
          const titleStr = slug
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          detectedTitle = titleStr;
          detectedDifficulty = "Medium"; // default
        }
      }
    } else if (lower.includes("codeforces.com") || parseCFLink(val)) {
      detectedPlatform = "Codeforces";
      const parsed = parseCFLink(val);
      if (parsed) {
        const { contestId, index } = parsed;
        
        // 1. Try finding in loaded cfProblems
        const matchedCf = cfProblems.find(p => p.contestId === contestId && p.index.toUpperCase() === index);
        // 2. Try finding in standardProblems
        const matchedStd = standardProblems.find(p => p.platform === "Codeforces" && p.problemCode === `${contestId}${index}`);
        
        if (matchedCf) {
          detectedTitle = matchedCf.name;
          const rating = matchedCf.rating;
          if (rating) {
            detectedDifficulty = rating < 1200 ? "Easy" : rating < 1600 ? "Medium" : "Hard";
          } else {
            detectedDifficulty = "Medium";
          }
        } else if (matchedStd) {
          detectedTitle = matchedStd.title;
          detectedDifficulty = matchedStd.difficulty;
        } else {
          detectedTitle = `${contestId}${index} - Live Problem`;
          detectedDifficulty = "Medium";
        }
      }
    } else if (lower.includes("geeksforgeeks.org")) {
      detectedPlatform = "GeeksforGeeks";
      const gfgMatch = val.match(/\/problems\/([^/]+)/);
      if (gfgMatch && gfgMatch[1]) {
        const titleStr = gfgMatch[1]
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        detectedTitle = titleStr;
      }
      detectedDifficulty = "Medium";
    } else if (lower.includes("sql") || lower.includes("query") || lower.includes("database")) {
      detectedPlatform = "SQL";
      detectedDifficulty = "Medium";
    } else if (lower.includes("puzzle") || lower.includes("riddle")) {
      detectedPlatform = "Puzzles";
      detectedDifficulty = "Medium";
    }

    setPlatform(detectedPlatform);
    setDifficulty(detectedDifficulty);
    setProblemTitle(detectedTitle);

    updateStoredFields({
      link: val,
      title: detectedTitle,
      plat: detectedPlatform,
      diff: detectedDifficulty
    });
  };

  // Timer controls
  const handleStartTimer = () => {
    if (!problemTitle.trim()) {
      alert("Please enter a problem title to start!");
      return;
    }
    setIsTimerRunning(true);
    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_TIMER,
      JSON.stringify({
        title: problemTitle,
        link: problemLink,
        plat: platform,
        diff: difficulty,
        startTime: Date.now(),
        accumulatedTime: 0,
        running: true
      })
    );
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    updateStoredTimer(timeElapsed, false);
  };

  const handleResumeTimer = () => {
    setIsTimerRunning(true);
    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_TIMER,
      JSON.stringify({
        title: problemTitle,
        link: problemLink,
        plat: platform,
        diff: difficulty,
        startTime: Date.now(),
        accumulatedTime: timeElapsed,
        running: true
      })
    );
  };

  const handleResetTimer = () => {
    if (window.confirm("Are you sure you want to discard this practice session?")) {
      setIsTimerRunning(false);
      setTimeElapsed(0);
      setProblemTitle("");
      setProblemLink("");
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
    }
  };

  const handleFinishSession = () => {
    if (!profile) return;
    if (timeElapsed < 5) {
      alert("Practice session is too short (minimum 5 seconds)!");
      return;
    }

    recordTimedSession(profile.username, {
      title: problemTitle || "Untitled Problem",
      linkOrId: problemLink || "None",
      platform: platform,
      difficulty: difficulty,
      timeSpentSeconds: timeElapsed
    });

    setIsTimerRunning(false);
    setTimeElapsed(0);
    setProblemTitle("");
    setProblemLink("");
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);

    setProfile(getUserProfile(profile.username));
  };

  const selectCfProblem = (prob: CodeforcesProblem) => {
    if (isTimerRunning) {
      if (!window.confirm("A timer is currently active! Selecting a new problem will pause and discard the current running timer. Proceed?")) {
        return;
      }
      setIsTimerRunning(false);
      setTimeElapsed(0);
    }

    setProblemTitle(prob.name);
    setProblemLink(`https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`);
    setPlatform("Codeforces");

    let diff: TimedSession["difficulty"] = "Medium";
    if (prob.rating) {
      if (prob.rating < 1200) diff = "Easy";
      else if (prob.rating > 1600) diff = "Hard";
    }
    setDifficulty(diff);

    // Save to localStorage immediately so form coordinates stay aligned
    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_TIMER,
      JSON.stringify({
        title: prob.name,
        link: `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`,
        plat: "Codeforces",
        diff: diff,
        startTime: null,
        accumulatedTime: 0,
        running: false
      })
    );
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, "0") : null,
      String(m).padStart(2, "0"),
      String(s).padStart(2, "0")
    ].filter(Boolean).join(":");
  };

  const formatReadableTime = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const getProblemRatingAndLink = () => {
    let rating: number | string = "N/A";
    let isPredicted = true;
    let url = problemLink;

    if (platform === "Codeforces") {
      const parseCFLink = (link: string) => {
        const problemsetMatch = link.match(/\/problemset\/problem\/(\d+)\/([A-Z0-9]+)/i);
        if (problemsetMatch) {
          return { contestId: parseInt(problemsetMatch[1]), index: problemsetMatch[2].toUpperCase() };
        }
        const contestMatch = link.match(/\/contest\/(\d+)\/problem\/([A-Z0-9]+)/i);
        if (contestMatch) {
          return { contestId: parseInt(contestMatch[1]), index: contestMatch[2].toUpperCase() };
        }
        const simpleMatch = link.trim().match(/^(\d+)([A-Z0-9]+)$/i);
        if (simpleMatch) {
          return { contestId: parseInt(simpleMatch[1]), index: simpleMatch[2].toUpperCase() };
        }
        return null;
      };

      const parsed = parseCFLink(problemLink);
      if (parsed) {
        const matchedCf = cfProblems.find(p => p.contestId === parsed.contestId && p.index.toUpperCase() === parsed.index);
        if (matchedCf && matchedCf.rating) {
          rating = matchedCf.rating;
          isPredicted = false;
        }
        url = `https://codeforces.com/problemset/problem/${parsed.contestId}/${parsed.index}`;
      }
    }

    if (rating === "N/A") {
      if (difficulty === "Easy") rating = 1000;
      else if (difficulty === "Medium") rating = 1400;
      else if (difficulty === "Hard") rating = 1800;
      isPredicted = true;
    }

    const isValidUrl = url.startsWith("http://") || url.startsWith("https://");
    return { rating, isPredicted, url, isValidUrl };
  };

  if (!profile) return null;

  const sessions = profile.timedSessions || [];

  // =============================================
  // Speed Analytics Computations
  // =============================================
  const totalSessions = sessions.length;

  const avgTimeSeconds = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.timeSpentSeconds, 0) / totalSessions)
    : 0;

  const fastestTimeSeconds = totalSessions > 0
    ? Math.min(...sessions.map(s => s.timeSpentSeconds))
    : 0;

  // 1. Line Chart Data: Solve Times over Time
  const speedTrendData = sessions.map((s, index) => {
    return {
      index: index + 1,
      problem: s.title.length > 12 ? `${s.title.substring(0, 10)}...` : s.title,
      fullTitle: s.title,
      platform: s.platform,
      minutes: parseFloat((s.timeSpentSeconds / 60).toFixed(2)),
      readable: formatReadableTime(s.timeSpentSeconds),
      date: s.solvedAt
    };
  });

  // 2. Bar Chart Data: Average Solve Speed by Difficulty
  const difficultyStats = ["Easy", "Medium", "Hard"].map(diff => {
    const diffSessions = sessions.filter(s => s.difficulty === diff);
    const avgSec = diffSessions.length > 0
      ? Math.round(diffSessions.reduce((sum, s) => sum + s.timeSpentSeconds, 0) / diffSessions.length)
      : 0;
    return {
      difficulty: diff,
      avgMinutes: parseFloat((avgSec / 60).toFixed(2)),
      count: diffSessions.length,
      readable: formatReadableTime(avgSec)
    };
  });

  // Explorer problemset level grouping tab helper
  const levels = ["A", "B", "C", "D", "E", "F", "G"];

  const getStandardizedLevel = (prob: CodeforcesProblem): string => {
    if (prob.rating) {
      const r = prob.rating;
      if (r <= 1200) return "A";
      if (r <= 1400) return "B";
      if (r <= 1600) return "C";
      if (r <= 1800) return "D";
      if (r <= 2000) return "E";
      if (r <= 2200) return "F";
      return "G";
    }
    // Fallback if no rating: map index character to level
    const origIndex = prob.index.toUpperCase().replace(/\d+/g, "");
    const indexChar = origIndex.charAt(0);
    if (["A", "B", "C", "D", "E", "F", "G"].includes(indexChar)) {
      return indexChar;
    }
    return "A";
  };

  const allFilteredCf = cfProblems.filter(prob => {
    const stdLevel = getStandardizedLevel(prob);
    const matchesLevel = stdLevel === selectedCfLevel;
    const matchesSearch = prob.name.toLowerCase().includes(cfSearchQuery.toLowerCase()) ||
      String(prob.contestId).includes(cfSearchQuery) ||
      (prob.rating && String(prob.rating).includes(cfSearchQuery)) ||
      prob.tags.some(tag => tag.toLowerCase().includes(cfSearchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const unsolvedCfProblems = allFilteredCf.filter(prob => {
    const probCode = `${prob.contestId}${prob.index}`;
    const isSolved = profile.solvedList.includes(`cf-${prob.contestId}-${prob.index.toLowerCase()}`) ||
      cfSolvedCodes.has(probCode.toUpperCase());
    return !isSolved;
  }).slice(0, 50); // Get the 50 most recent unsolved

  const solvedCfProblems = allFilteredCf.filter(prob => {
    const probCode = `${prob.contestId}${prob.index}`;
    const isSolved = profile.solvedList.includes(`cf-${prob.contestId}-${prob.index.toLowerCase()}`) ||
      cfSolvedCodes.has(probCode.toUpperCase());
    return isSolved;
  }).slice(0, 50); // Get the 50 most recent solved

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy": return "#10b981"; // Emerald
      case "Medium": return "#f59e0b"; // Amber
      case "Hard": return "#ef4444"; // Rose
      default: return "#71717a";
    }
  };

  const getDifficultyBgStyles = (diff: string) => {
    switch (diff) {
      case "Easy": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "Medium": return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "Hard": return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default: return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
    }
  };

  const getPlatformBgStyles = (plat: string) => {
    switch (plat) {
      case "LeetCode": return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "Codeforces": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "GeeksforGeeks": return "bg-green-500/10 border-green-500/20 text-green-400";
      case "SQL": return "bg-purple-500/10 border-purple-500/20 text-purple-400";
      case "Puzzles": return "bg-orange-500/10 border-orange-500/20 text-orange-400";
      default: return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content view */}
      <main className="flex-1 lg:pl-72 pl-0 min-h-screen flex flex-col bg-zinc-950 pb-12">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between lg:px-8 px-4 pl-16 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-white">
              Timed Practice Engine
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Start a stopwatch for your coding practices to analyze and improve speed over time.</p>
          </div>
        </header>

        {/* Outer Dashboard content wrapper */}
        <div className="lg:p-8 p-4 space-y-8 max-w-6xl w-full mx-auto">

          {/* Auto-Solve Success Notification Banner */}
          {autoSolveSuccessMessage && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 flex items-center gap-3 shadow-lg shadow-emerald-500/10 animate-fadeIn">
              <Sparkles className="h-5 w-5 text-emerald-400 animate-bounce" />
              <div className="font-semibold text-xs leading-relaxed">{autoSolveSuccessMessage}</div>
            </div>
          )}

          {/* Collapsible Codeforces Live Problem Explorer */}
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-xl">
            <button
              onClick={() => setExplorerExpanded(!explorerExpanded)}
              className="w-full flex items-center justify-between text-white font-bold text-md select-none outline-none"
            >
              <h3 className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                Codeforces Live Problem Explorer (50+ Recent Problems per Level)
              </h3>
              <div className="text-zinc-500 hover:text-white transition-colors">
                {explorerExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {explorerExpanded && (
              <div className="mt-5 space-y-5 animate-slideDown">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-white/5 pb-3">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Browse and select dynamically fetched recent Codeforces challenges. Click any problem to populate the timer form.
                  </p>
                  {profile.cfHandle && (
                    <div className="text-[11px] font-semibold flex items-center gap-1.5 self-start md:self-auto bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 animate-fadeIn">
                      <div className={`h-2 w-2 rounded-full ${cfHistoricalLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                      <span className="text-zinc-400">
                        Handle: <span className="text-white font-bold">{profile.cfHandle}</span>
                        {cfHistoricalLoading ? " (syncing historical solves...)" : " (historical solves synced!)"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Level grouping tabs & search */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                  {/* Horizontal Level tabs */}
                  <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded-lg border border-white/5">
                    {levels.map(level => (
                      <button
                        key={level}
                        onClick={() => {
                          setSelectedCfLevel(level);
                          localStorage.setItem("ic_cf_selected_level", level);
                        }}
                        className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all ${selectedCfLevel === level
                          ? "bg-violet-600 text-white shadow-inner"
                          : "text-zinc-500 hover:text-white"
                          }`}
                      >
                        Level {level}
                      </button>
                    ))}
                  </div>

                  {/* Search query field */}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                    <input
                      type="text"
                      value={cfSearchQuery}
                      onChange={(e) => setCfSearchQuery(e.target.value)}
                      placeholder="Search title, contest, tag or rating..."
                      className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-white/5 bg-black/40 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-all"
                    />
                  </div>
                </div>

                {/* Problem explorer items list grid */}
                <div className="max-h-[280px] overflow-y-auto border border-white/5 rounded-xl bg-black/20 divide-y divide-white/[0.03] text-xs">
                  {cfProblemsLoading ? (
                    <div className="p-12 text-center text-zinc-500 animate-pulse font-medium">
                      Fetching live Codeforces problemset database...
                    </div>
                  ) : cfProblemsError ? (
                    <div className="p-12 text-center text-red-400 font-semibold flex flex-col items-center gap-2">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                      <span>{cfProblemsError}</span>
                      <button
                        onClick={async () => {
                          setCfProblemsLoading(true);
                          try {
                            setCfProblems(await fetchCodeforcesProblemset());
                            setCfProblemsError(null);
                          } catch (e: any) {
                            setCfProblemsError(e.message || "Failed to load");
                          } finally {
                            setCfProblemsLoading(false);
                          }
                        }}
                        className="mt-2 px-3 py-1.5 rounded bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-all"
                      >
                        Retry Load
                      </button>
                    </div>
                  ) : unsolvedCfProblems.length === 0 && solvedCfProblems.length === 0 ? (
                    <div className="p-12 text-center text-zinc-600 font-medium">
                      No matching recent problems found for level {selectedCfLevel}.
                    </div>
                  ) : (
                    <>
                      {/* Unsolved Problems listed first */}
                      {unsolvedCfProblems.map(prob => {
                        const probCode = `${prob.contestId}${prob.index}`;
                        const displayRating = prob.rating || (selectedCfLevel === "A" ? 1000 : selectedCfLevel === "B" ? 1300 : selectedCfLevel === "C" ? 1500 : selectedCfLevel === "D" ? 1700 : selectedCfLevel === "E" ? 1900 : selectedCfLevel === "F" ? 2100 : 2300);
                        return (
                          <div
                            key={`${prob.contestId}-${prob.index}`}
                            onClick={() => selectCfProblem(prob)}
                            className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            {/* Info */}
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white truncate max-w-[200px] md:max-w-xs">{prob.name}</span>
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px] font-semibold">
                                  {probCode}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-0.5 bg-zinc-800/40 px-2 py-0.5 rounded-full border border-white/5">
                                  <span>Unsolved</span>
                                </span>
                              </div>
                            </div>

                            {/* Meta & Button */}
                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${displayRating < 1200 ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                displayRating < 1600 ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                                  "border-rose-500/20 text-rose-400 bg-rose-500/5"
                                }`}>
                                Rating: {displayRating}
                              </span>
                              <a
                                href={`https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectCfProblem(prob);
                                }}
                                className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-[10px] font-bold text-white transition-all shadow-md inline-block text-center"
                              >
                                Load problem
                              </a>
                            </div>
                          </div>
                        );
                      })}

                      {/* Collapsible Solved Problems Dropdown */}
                      {solvedCfProblems.length > 0 && (
                        <div className="border-t border-white/5 bg-black/40">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSolvedInExplorer(!showSolvedInExplorer);
                            }}
                            className="w-full p-3.5 flex items-center justify-between text-zinc-400 hover:text-white font-bold select-none outline-none transition-colors"
                          >
                            <span>Solved Problems ({solvedCfProblems.length})</span>
                            {showSolvedInExplorer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          
                          {showSolvedInExplorer && (
                            <div className="divide-y divide-white/[0.03] border-t border-white/5 animate-fadeIn">
                              {solvedCfProblems.map(prob => {
                                const probCode = `${prob.contestId}${prob.index}`;
                                const displayRating = prob.rating || (selectedCfLevel === "A" ? 1000 : selectedCfLevel === "B" ? 1300 : selectedCfLevel === "C" ? 1500 : selectedCfLevel === "D" ? 1700 : selectedCfLevel === "E" ? 1900 : selectedCfLevel === "F" ? 2100 : 2300);
                                return (
                                  <div
                                    key={`${prob.contestId}-${prob.index}`}
                                    onClick={() => selectCfProblem(prob)}
                                    className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors bg-emerald-950/[0.02]"
                                  >
                                    {/* Info */}
                                    <div className="space-y-1.5 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white truncate max-w-[200px] md:max-w-xs">{prob.name}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px] font-semibold">
                                          {probCode}
                                        </span>
                                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                          <CheckCircle className="h-3.5 w-3.5 fill-emerald-500/10 text-emerald-500" />
                                          <span>Solved</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Meta & Button */}
                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${displayRating < 1200 ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                        displayRating < 1600 ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                                          "border-rose-500/20 text-rose-400 bg-rose-500/5"
                                        }`}>
                                        Rating: {displayRating}
                                      </span>
                                      <a
                                        href={`https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          selectCfProblem(prob);
                                        }}
                                        className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-[10px] font-bold text-white transition-all shadow-md inline-block text-center"
                                      >
                                        Load problem
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Central Grid: Stopwatch Controls & Setup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Form Setup (col-span-5) */}
            <div className="lg:col-span-5 p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-violet-400 fill-current animate-pulse" />
                  Practice Setup
                </h3>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                  Enter the coding problem details below. Start your stopwatch to initiate focus mode.
                </p>

                <div className="space-y-4">
                  {/* Link Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Problem Link or ID</label>
                    <input
                      type="text"
                      disabled={isTimerRunning}
                      value={problemLink}
                      onChange={(e) => handleLinkChange(e.target.value)}
                      placeholder="e.g. https://leetcode.com/problems/two-sum or 4A"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-black/40 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-all font-mono"
                    />
                  </div>

                  {/* Title Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Problem Title</label>
                    <input
                      type="text"
                      disabled={isTimerRunning}
                      value={problemTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Two Sum"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-black/40 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-all"
                    />
                  </div>

                  {/* Platform and Difficulty Side-by-Side */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Platform Selector */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Platform</label>
                      <select
                        disabled={isTimerRunning}
                        value={platform}
                        onChange={(e) => handlePlatformChange(e.target.value as TimedSession["platform"])}
                        className="w-full px-3 py-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-all"
                      >
                        <option value="LeetCode">LeetCode</option>
                        <option value="Codeforces">Codeforces</option>
                        <option value="GeeksforGeeks">GeeksforGeeks</option>
                        <option value="SQL">SQL Practice</option>
                        <option value="Puzzles">Logic Puzzle</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Difficulty Selector */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Difficulty</label>
                      <select
                        disabled={isTimerRunning}
                        value={difficulty}
                        onChange={(e) => handleDifficultyChange(e.target.value as TimedSession["difficulty"])}
                        className="w-full px-3 py-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-all"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Rating & Clickable Link Preview */}
                  {(problemTitle || problemLink) && (() => {
                    const { rating, isPredicted, url, isValidUrl } = getProblemRatingAndLink();
                    return (
                      <div className="mt-4 p-3.5 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between text-xs animate-fadeIn">
                        <div className="flex items-center gap-2.5">
                          <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Rating:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPredicted 
                              ? "bg-zinc-500/10 border border-zinc-500/20 text-zinc-400" 
                              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          }`}>
                            {rating} {isPredicted && <span className="text-[8px] font-normal opacity-50 ml-0.5">(Predicted)</span>}
                          </span>
                        </div>
                        {isValidUrl && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 font-bold text-[10px] bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg"
                          >
                            <span>Open Problem</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Status Alert and Auto-Solve Active Indicator */}
              {isTimerRunning && (
                <div className="mt-6 space-y-2">
                  <div className="p-3 rounded-xl border border-violet-500/10 bg-violet-500/[0.02] text-[11px] text-violet-300 flex items-start gap-2 animate-pulse">
                    <AlertCircle className="h-4 w-4 shrink-0 text-violet-400" />
                    <span>
                      Practice is active! Go solve the problem in your external tab. We will log the precise time when you click Finish.
                    </span>
                  </div>

                  {platform === "Codeforces" && profile?.cfHandle && autoSolveStatus && (
                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-[11px] text-emerald-300 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-emerald-400 animate-spin" style={{ animationDuration: "3s" }} />
                      <span className="font-semibold">{autoSolveStatus}</span>
                    </div>
                  )}

                  {platform === "Codeforces" && !profile?.cfHandle && (
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] text-[11px] text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>
                        Sync your Codeforces handle in the Dashboard first to enable automatic background solve checking!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: stopwatch display (col-span-7) */}
            <div className="lg:col-span-7 p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col items-center justify-center shadow-xl relative min-h-[360px] overflow-hidden group">
              <div className="absolute top-0 right-0 h-64 w-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-64 w-64 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none" />

              {/* Glowing active timer ring or capsule */}
              <div className="flex flex-col items-center text-center space-y-6 z-10">
                <div className={`p-8 md:p-12 rounded-full border border-white/10 bg-black/60 shadow-2xl relative flex items-center justify-center min-w-[220px] md:min-w-[280px] aspect-square transition-all duration-700 ${isTimerRunning ? "border-violet-500/30 ring-4 ring-violet-500/5 shadow-violet-500/10 scale-105" : ""
                  }`}>
                  {/* Subtle pulsing background glow inside the circle */}
                  {isTimerRunning && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500/5 to-fuchsia-500/5 animate-pulse" />
                  )}

                  <div className="flex flex-col items-center relative">
                    <Clock className={`h-6 w-6 text-zinc-500 mb-2.5 ${isTimerRunning ? "text-violet-400 animate-spin" : ""}`} style={{ animationDuration: "12s" }} />
                    <span className="font-mono text-5xl md:text-6xl font-black tracking-wider text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      {formatTime(timeElapsed)}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1.5">Elapsed Duration</span>
                  </div>
                </div>

                {/* Displaying active problem info */}
                {timeElapsed > 0 && (
                  <div className="animate-fadeIn">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-widest">Active Focus Session</span>
                    <h4 className="font-bold text-white text-md mt-1">{problemTitle || "Untitled Problem"}</h4>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getDifficultyBgStyles(difficulty)}`}>
                        {difficulty}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getPlatformBgStyles(platform)}`}>
                        {platform}
                      </span>
                    </div>
                  </div>
                )}

                {/* Controller Action buttons */}
                <div className="flex items-center gap-4 pt-4">
                  {/* Cancel / Reset */}
                  {timeElapsed > 0 && (
                    <button
                      onClick={handleResetTimer}
                      className="p-3.5 rounded-full border border-white/5 bg-zinc-900 hover:bg-white/[0.04] text-zinc-400 hover:text-red-400 transition-all shadow-md flex items-center justify-center"
                      title="Reset Session"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  )}

                  {/* Start / Pause / Resume */}
                  {!isTimerRunning && timeElapsed === 0 ? (
                    <button
                      onClick={handleStartTimer}
                      className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm transition-all shadow-xl shadow-violet-500/20 hover:scale-105 flex items-center gap-2.5"
                    >
                      <Play className="h-4.5 w-4.5 fill-current" />
                      <span>Start Practice</span>
                    </button>
                  ) : !isTimerRunning ? (
                    <button
                      onClick={handleResumeTimer}
                      className="px-8 py-4 rounded-full bg-zinc-800 border border-white/5 hover:bg-zinc-700 text-white font-semibold text-sm transition-all shadow-xl hover:scale-105 flex items-center gap-2.5"
                    >
                      <Play className="h-4.5 w-4.5 fill-current" />
                      <span>Resume Timer</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseTimer}
                      className="px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all shadow-xl shadow-amber-500/10 hover:scale-105 flex items-center gap-2.5"
                    >
                      <Pause className="h-4.5 w-4.5 fill-current" />
                      <span>Pause Session</span>
                    </button>
                  )}

                  {/* Finish & Record */}
                  {timeElapsed > 0 && (
                    <button
                      onClick={handleFinishSession}
                      className="px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 flex items-center gap-2.5"
                    >
                      <Square className="h-4 w-4 fill-current" />
                      <span>Finish & Solve</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics summary row cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total Timed solved */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-violet-600/10 rounded-full blur-xl" />
              <div className="flex justify-between items-center mb-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <span>Timed Solves</span>
                <Clock className="h-5 w-5 text-violet-400" />
              </div>
              <span className="text-4xl font-extrabold text-white">{totalSessions}</span>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium">Session records saved under time pressure</p>
            </div>

            {/* Average time spent */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-600/10 rounded-full blur-xl" />
              <div className="flex justify-between items-center mb-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <span>Average Speed</span>
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-4xl font-extrabold text-white">
                {totalSessions > 0 ? formatReadableTime(avgTimeSeconds) : "--"}
              </span>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium">Average solve time across all categories</p>
            </div>

            {/* Fastest solve */}
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-amber-600/10 rounded-full blur-xl" />
              <div className="flex justify-between items-center mb-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <span>Personal Best</span>
                <Award className="h-5 w-5 text-amber-400 fill-current" />
              </div>
              <span className="text-4xl font-extrabold text-white">
                {totalSessions > 0 ? formatReadableTime(fastestTimeSeconds) : "--"}
              </span>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium">Your absolute fastest timed coding solve</p>
            </div>
          </div>

          {/* Performance & Charts section */}
          {totalSessions > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">

              {/* Speed Trends Chronology Line Chart (col-span-7) */}
              <div className="lg:col-span-7 p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-400" />
                    Solve Speed Trend over Time
                  </h3>
                  <p className="text-xs text-zinc-500 mb-6">Visualizes problem-solving durations (minutes) in chronological order. A downward trend indicates speed increase!</p>
                </div>

                <div className="h-64 w-full text-xs font-semibold">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={speedTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="index" stroke="#52525b" tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#52525b"
                          tickLine={false}
                          axisLine={false}
                          unit="m"
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-1">
                                  <p className="font-bold text-white">{data.fullTitle}</p>
                                  <p className="text-zinc-400">Platform: {data.platform}</p>
                                  <p className="text-violet-400 font-semibold">Solve Time: {data.readable}</p>
                                  <p className="text-zinc-500 text-[10px]">Solved on: {data.date}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="minutes"
                          stroke="#a78bfa"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorSpeed)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600">
                      Loading speed trends...
                    </div>
                  )}
                </div>
              </div>

              {/* Speed by Difficulty Bar Chart (col-span-5) */}
              <div className="lg:col-span-5 p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-violet-400" />
                    Average Solve Speed by Difficulty
                  </h3>
                  <p className="text-xs text-zinc-500 mb-6">Comparing average minutes spent solving Easy, Medium, and Hard challenges.</p>
                </div>

                <div className="h-64 w-full text-xs font-semibold">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={difficultyStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="difficulty" stroke="#52525b" tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" tickLine={false} axisLine={false} unit="m" />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-1">
                                  <p className="font-bold text-white">{data.difficulty} Problems</p>
                                  <p className="text-zinc-400">Total Solves: {data.count}</p>
                                  <p className="text-violet-400 font-semibold">Avg Time: {data.readable}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="avgMinutes" radius={[8, 8, 0, 0]}>
                          {difficultyStats.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={getDifficultyColor(entry.difficulty)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600">
                      Loading comparisons...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chronological Recent Timed Sessions Log */}
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-xl">
            <h3 className="text-md font-bold text-white mb-5 flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-400" />
              Recent Timed Practice Sessions
            </h3>

            {sessions.length === 0 ? (
              <div className="p-12 rounded-xl border border-dashed border-white/5 text-center flex flex-col items-center justify-center">
                <HelpCircle className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">No timed practice sessions logged yet. Fire up the stopwatch above!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-400 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 font-semibold">
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Problem Title</th>
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Platform</th>
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Difficulty</th>
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Solve Date</th>
                      <th className="py-3 px-4 uppercase tracking-wider text-[10px] text-right">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...sessions].reverse().map((session) => (
                      <tr key={session.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <span>{session.title}</span>
                          {session.linkOrId && session.linkOrId.startsWith("http") && (
                            <a
                              href={session.linkOrId}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-600 hover:text-white transition-colors"
                              title="Go to problem"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getPlatformBgStyles(session.platform)}`}>
                            {session.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getDifficultyBgStyles(session.difficulty)}`}>
                            {session.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500 font-medium">
                          {session.solvedAt}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatReadableTime(session.timeSpentSeconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
