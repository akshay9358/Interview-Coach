"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle, UserPlus } from "lucide-react";
import { setLoggedInUser, getLoggedInUser } from "@/lib/db";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getLoggedInUser()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Save user credentials in mock LocalStorage DB
    setTimeout(() => {
      const usersRaw = localStorage.getItem("ic_users_db");
      const users = usersRaw ? JSON.parse(usersRaw) : {};

      if (users[username.toLowerCase()] || username.toLowerCase() === "guest") {
        setError("Username already taken. Please choose another one.");
        setLoading(false);
        return;
      }

      users[username.toLowerCase()] = password;
      localStorage.setItem("ic_users_db", JSON.stringify(users));
      
      setSuccess(true);
      setLoggedInUser(username);
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }, 800);
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
            Create an Account
          </h2>
          <p className="text-zinc-500 text-xs mt-2 text-center">
            Sign up to track, evaluate, and gamify your interview prep.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm mb-6">
            <span>Account created successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
              Choose Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. coder_alice"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
              Choose Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4.5 w-4.5" />
                <span>Create Free Coach Profile</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-zinc-500">
          <span>Already have an account? </span>
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
