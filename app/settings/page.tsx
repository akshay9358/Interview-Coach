"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Settings, 
  Database, 
  Server, 
  CheckCircle, 
  HelpCircle, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Cpu 
} from "lucide-react";
import { getLoggedInUser, getUserProfile, UserProfile, supabase } from "@/lib/db";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCloudActive, setIsCloudActive] = useState(false);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setProfile(getUserProfile(user));
    }
    // Check if Supabase connection client is active
    setIsCloudActive(supabase !== null);
  }, []);

  const handleCopySchema = () => {
    const sqlSchema = `-- Create the profiles table matching our frontend typescript interfaces
create table if not exists profiles (
  username text primary key,
  cf_handle text,
  lc_handle text,
  streak integer default 0,
  last_active_date text,
  xp integer default 0,
  solved_list text[] default array[]::text[],
  solved_puzzles text[] default array[]::text[],
  solved_sql text[] default array[]::text[],
  solved_custom_count integer default 0,
  solved_puzzle_answers jsonb default '{}'::jsonb,
  solved_sql_answers jsonb default '{}'::jsonb,
  activity_log jsonb default '{}'::jsonb,
  timed_sessions jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create a simple policy to allow public read/write access
create policy "Allow public access" 
on profiles for all 
using (true) 
with check (true);`;

    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main view container */}
      <main className="flex-1 pl-72 min-h-screen flex flex-col bg-zinc-950 pb-12 animate-fadeIn">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-violet-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Settings & Cloud Sync Console
            </h1>
          </div>
        </header>

        {/* Inner Settings dashboard */}
        <div className="p-8 space-y-8 max-w-5xl w-full mx-auto">
          
          {/* Connection diagnostics panel */}
          <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
            isCloudActive 
              ? "border-emerald-500/20 bg-emerald-500/[0.02]" 
              : "border-violet-500/10 bg-violet-500/[0.01]"
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${isCloudActive ? "bg-emerald-500 shadow-md shadow-emerald-500/50" : "bg-violet-500 shadow-md shadow-violet-500/50"}`} />
                <h3 className="font-bold text-sm text-white">
                  Database Mode: {isCloudActive ? "Supabase Cloud Database Active" : "Local Storage Mode (Fallback Active)"}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
                {isCloudActive 
                  ? "Congratulations! Your frontend is connected to Supabase PostgreSQL. All solves, XP, MCQ options, and custom timer logs are synchronizing securely to the cloud." 
                  : "Your database is operating locally in the browser's sandbox. Your data is safe locally, but will not survive if you clear your browser cookies. Set up Supabase to persist progress across devices!"}
              </p>
            </div>

            <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${
              isCloudActive 
                ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" 
                : "border-violet-500/20 text-violet-400 bg-violet-500/10"
            }`}>
              {isCloudActive ? "Cloud Connection Online" : "Local Sandbox Active"}
            </span>
          </div>

          {/* Setup Guide Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-zinc-500" />
              How to configure Supabase Cloud Database
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 card */}
              <div className="p-5 rounded-2xl border border-white/5 bg-zinc-900/20 hover:border-white/10 transition-all flex flex-col justify-between space-y-4 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">01</span>
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-violet-400">1. Sign Up & Setup</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                    Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline hover:text-white">supabase.com</a>, register a free account, and click <strong>New Project</strong>. Name your project, set your db password, and deploy.
                  </p>
                </div>
              </div>

              {/* Step 2 card */}
              <div className="p-5 rounded-2xl border border-white/5 bg-zinc-900/20 hover:border-white/10 transition-all flex flex-col justify-between space-y-4 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">02</span>
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-violet-400">2. Run SQL Schema Script</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                    Open the **SQL Editor** inside your Supabase dashboard. Copy our schema creation script (below), paste it into the editor, and click **Run**.
                  </p>
                </div>
              </div>

              {/* Step 3 card */}
              <div className="p-5 rounded-2xl border border-white/5 bg-zinc-900/20 hover:border-white/10 transition-all flex flex-col justify-between space-y-4 relative group">
                <span className="absolute top-4 right-4 text-3xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">03</span>
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-violet-400">3. Save Connection Keys</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                    Locate your API credentials under **Settings** -&gt; **API**. Paste them in your local <code className="text-zinc-300">.env.local</code> template file to activate instant syncing!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Copyable SQL schema code section */}
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4 relative shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Server className="h-4.5 w-4.5 text-violet-400" />
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Supabase Schema SQL Script</h4>
              </div>
              <button
                onClick={handleCopySchema}
                className="px-3.5 py-1.5 rounded-xl border border-white/5 bg-black/40 hover:bg-white/[0.02] text-xs font-semibold flex items-center gap-1.5 transition-all text-zinc-300 hover:text-white select-none"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied Script!" : "Copy SQL Script"}</span>
              </button>
            </div>

            <pre className="text-[10px] font-mono text-zinc-500 bg-black/60 p-4 rounded-xl max-h-56 overflow-y-auto leading-relaxed border border-white/5 select-all">
{`-- Create the profiles table matching our frontend typescript interfaces
create table if not exists profiles (
  username text primary key,
  cf_handle text,
  lc_handle text,
  streak integer default 0,
  last_active_date text,
  xp integer default 0,
  solved_list text[] default array[]::text[],
  solved_puzzles text[] default array[]::text[],
  solved_sql text[] default array[]::text[],
  solved_custom_count integer default 0,
  solved_puzzle_answers jsonb default '{}'::jsonb,
  solved_sql_answers jsonb default '{}'::jsonb,
  activity_log jsonb default '{}'::jsonb,
  timed_sessions jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create a simple policy to allow public read/write access
create policy "Allow public access" 
on profiles for all 
using (true) 
with check (true);`}
            </pre>
          </div>

          {/* Vercel Hosting Integration instructions */}
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Hosting on Vercel with Cloud Backend
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Because our connection structure is completely client-side dynamic and environment variables are injected using <code className="text-zinc-200">NEXT_PUBLIC_</code> prefix, **Vercel deployment is plug-and-play**:
            </p>
            <ul className="list-disc pl-5 text-[11px] text-zinc-500 space-y-2 leading-relaxed">
              <li>
                <strong className="text-zinc-400">Environment Variables Sync:</strong> When importing this GitHub repository to Vercel, simply copy-paste your two environment variables (<code className="text-zinc-300">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-zinc-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) into Vercel's **Environment Variables** deployment block.
              </li>
              <li>
                <strong className="text-zinc-400">Zero-Loss Persistence:</strong> Since Vercel uses the same cloud database backend, you can practice on your phone, deploy code updates to production, or change browsers, and your scores, streaks, and solve logs will always remain perfectly synchronized!
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
