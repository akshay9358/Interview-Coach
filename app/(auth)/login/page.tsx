"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle, KeyRound } from "lucide-react";
import { setLoggedInUser, getLoggedInUser } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect straight to dashboard
    if (getLoggedInUser()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleGuestLogin = () => {
    if (typeof window !== "undefined") {
      // Log in as Guest
      localStorage.setItem("ic_current_user", "Guest");
      
      const profilesRaw = localStorage.getItem("ic_profiles") || "{}";
      const profiles = JSON.parse(profilesRaw);
      
      // Force reset Guest profile to be completely empty and fresh
      profiles["Guest"] = {
        username: "Guest",
        streak: 0,
        xp: 0,
        solvedList: [],
        solvedPuzzles: [],
        solvedSql: [],
        solvedCustomCount: 0,
        activityLog: {},
        timedSessions: []
      };
      localStorage.setItem("ic_profiles", JSON.stringify(profiles));
      
      router.push("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    // 1. Try local credentials check first
    const usersRaw = localStorage.getItem("ic_users_db");
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    const storedPassword = users[username.toLowerCase()] || users[username];

    if (
      (username.toLowerCase() === "guest" && password === "guest123") ||
      (storedPassword && storedPassword === password)
    ) {
      setLoggedInUser(username);
      router.push("/dashboard");
      return;
    }

    // 2. If local check fails, query Supabase Cloud (for multi-device sync)
    try {
      const { supabase } = await import("@/lib/db");
      if (supabase) {
        // Query case-insensitively using .ilike to match "Akshay" correctly
        const { data: cloudProfile, error: cloudErr } = await supabase
          .from("profiles")
          .select("*")
          .ilike("username", username)
          .single();

        if (cloudProfile && cloudProfile.password === password) {
          // Sync credentials locally
          users[username.toLowerCase()] = password;
          users[cloudProfile.username] = password;
          localStorage.setItem("ic_users_db", JSON.stringify(users));

          // Sync profile data locally
          const profilesRaw = localStorage.getItem("ic_profiles") || "{}";
          const profiles = JSON.parse(profilesRaw);
          profiles[cloudProfile.username] = {
            username: cloudProfile.username,
            cfHandle: cloudProfile.cf_handle,
            lcHandle: cloudProfile.lc_handle,
            streak: cloudProfile.streak,
            lastActiveDate: cloudProfile.last_active_date,
            xp: cloudProfile.xp,
            solvedList: cloudProfile.solved_list || [],
            solvedPuzzles: cloudProfile.solved_puzzles || [],
            solvedSql: cloudProfile.solved_sql || [],
            solvedCustomCount: cloudProfile.solved_custom_count || 0,
            solvedPuzzleAnswers: cloudProfile.solved_puzzle_answers || {},
            solvedSqlAnswers: cloudProfile.solved_sql_answers || {},
            activityLog: cloudProfile.activity_log || {},
            timedSessions: cloudProfile.timed_sessions || []
          };
          localStorage.setItem("ic_profiles", JSON.stringify(profiles));

          setLoggedInUser(cloudProfile.username);
          router.push("/dashboard");
          return;
        }
      }
    } catch (err) {
      console.error("Supabase cloud login validation error:", err);
    }

    setError("Invalid username or password. Try 'guest' and 'guest123' to test!");
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-black overflow-hidden font-sans">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[128px] animate-pulse" />

      {/* Card Wrapper */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl shadow-2xl relative z-10 mx-4">
        {/* Back to Home arrow link */}
        <Link href="/" className="absolute top-6 left-6 text-zinc-500 hover:text-zinc-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors select-none">
          <span>← Home</span>
        </Link>

        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 font-bold text-white shadow-lg shadow-violet-500/25 mb-4 text-xl">
            IC
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Welcome to Interview Coach
          </h2>
          <p className="text-zinc-500 text-xs mt-2 text-center">
            Sign in to track your competitive programming, SQL, and puzzle practice.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm mb-6 animate-shake">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <KeyRound className="h-4.5 w-4.5" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-zinc-500">
          <span>Don't have an account? </span>
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Sign Up
          </Link>
        </div>

        {/* Demo login button */}
        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <button
            onClick={handleGuestLogin}
            type="button"
            className="w-full py-2.5 rounded-xl border border-dashed border-violet-500/30 hover:border-violet-500 bg-violet-600/5 hover:bg-violet-600/10 text-violet-300 hover:text-violet-200 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer outline-none shadow-sm shadow-violet-500/5"
          >
            Sign In as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
