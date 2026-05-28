"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Code2, Database, Puzzle, BarChart3, Terminal, Award, Sparkles } from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      title: "Data Structures & Algorithms",
      desc: "Practice key patterns (sliding window, binary search, graphs) with pre-curated trackers and active stats.",
      icon: Code2,
      color: "from-blue-500 to-indigo-500 shadow-blue-500/10"
    },
    {
      title: "Competitive Programming",
      desc: "Sync your Codeforces handle to live-validate submissions and track CP ratings in real-time.",
      icon: Sparkles,
      color: "from-emerald-500 to-teal-500 shadow-emerald-500/10"
    },
    {
      title: "Live SQL playground",
      desc: "Run real SELECT, JOIN, and nested query test cases against embedded mock databases using in-browser SQL.js compiler.",
      icon: Terminal,
      color: "from-violet-500 to-fuchsia-500 shadow-violet-500/10"
    },
    {
      title: "Logic & Math Puzzles",
      desc: "Master trending riddles and structural brainteasers asked in elite buy-side and quantitative tech interviews.",
      icon: Puzzle,
      color: "from-orange-500 to-amber-500 shadow-orange-500/10"
    }
  ];

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Background Neon Blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[150px]" />
      <div className="absolute bottom-[10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-fuchsia-600/10 blur-[150px]" />

      {/* Navigation Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 font-bold text-white shadow-lg shadow-violet-500/25">
            IC
          </div>
          <span className="font-semibold text-lg bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Interview Coach
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-sm font-semibold shadow-lg shadow-white/5"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-xs font-semibold mb-6">
          <Award className="h-4 w-4" />
          <span>The Ultimate Software Engineer Practice Suite</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-8 bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          Accelerate Your <br />
          Technical Interview Preparation
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Track daily problems solved, evaluate custom SQL queries in real-time, solve trending quant puzzles, and monitor analytics—all from one unified dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20 active:scale-98 transition-all"
          >
            <span>Start Practice Free</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 hover:text-white font-semibold transition-all text-center"
          >
            Try Demo Account
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12 border-t border-white/5">
        <h3 className="text-xs font-bold text-violet-400 tracking-widest uppercase text-center mb-16">
          Four Pillars of Interview Mastery
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl border border-white/5 bg-zinc-950/40 backdrop-blur-md hover:border-white/10 transition-all duration-300 shadow-xl"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${feat.color} text-white shadow-lg mb-6 group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
                  {feat.title}
                </h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Terminal / SQL Callout */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="p-8 md:p-12 rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-violet-600/10 rounded-full blur-2xl" />
          <Database className="h-12 w-12 text-violet-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">Embedded In-Browser SQL playground</h3>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Stop copy-pasting code. Run queries on dynamic schema structures, retrieve live result logs immediately, and cross-examine matching results client-side.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors group"
          >
            <span>Open SQL console</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-zinc-600 text-xs">
        <p>© 2026 Interview Coach. Open-source tracking system. All rights reserved.</p>
      </footer>
    </div>
  );
}
