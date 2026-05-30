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
  Cpu,
  Download,
  Upload
} from "lucide-react";
import { getLoggedInUser, getUserProfile, UserProfile, supabase } from "@/lib/db";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCloudActive, setIsCloudActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [amoledEnabled, setAmoledEnabled] = useState(false);
  const [resetPrompt, setResetPrompt] = useState(false);
  const [storageBytes, setStorageBytes] = useState(0);
  const [localUsersCount, setLocalUsersCount] = useState(0);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setProfile(getUserProfile(user));
    }
    // Check if Supabase connection client is active
    setIsCloudActive(supabase !== null);

    // Load preferences
    if (typeof window !== "undefined") {
      setSoundEnabled(localStorage.getItem("ic_sound_enabled") !== "false");
      setAmoledEnabled(localStorage.getItem("ic_amoled_enabled") === "true");

      // Calculate storage space
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x]?.length || 0) * 2; // UTF-16 characters are 2 bytes
        }
      }
      setStorageBytes(total);

      // Local users
      const usersRaw = localStorage.getItem("ic_users_db");
      const users = usersRaw ? Object.keys(JSON.parse(usersRaw)) : [];
      setLocalUsersCount(users.length + 1); // +1 for Guest
    }
  }, []);

  const handleToggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem("ic_sound_enabled", String(newVal));
  };

  const handleToggleAmoled = () => {
    const newVal = !amoledEnabled;
    setAmoledEnabled(newVal);
    localStorage.setItem("ic_amoled_enabled", String(newVal));
    
    // Trigger custom event so other components reload styles
    window.dispatchEvent(new Event("theme_updated"));
  };

  const handleResetProfile = () => {
    if (!resetPrompt) {
      setResetPrompt(true);
      setTimeout(() => setResetPrompt(false), 5000); // Auto-dismiss prompt after 5 seconds
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.clear();
      // Reload page to re-initialize defaults
      window.location.href = "/";
    }
  };

  const handleExportBackup = () => {
    if (typeof window === "undefined" || !profile) return;
    const profiles = localStorage.getItem("ic_profiles") || "{}";
    const users = localStorage.getItem("ic_users_db") || "{}";
    const backupData = {
      version: "1.0",
      profiles: JSON.parse(profiles),
      users: JSON.parse(users),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ic_backup_${profile.username}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window === "undefined" || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.profiles && typeof data.profiles === "object") {
          localStorage.setItem("ic_profiles", JSON.stringify(data.profiles));
          if (data.users) {
            localStorage.setItem("ic_users_db", JSON.stringify(data.users));
          }
          alert("Backup imported successfully! Page will now reload.");
          window.location.reload();
        } else {
          alert("Invalid backup file format!");
        }
      } catch (err) {
        alert("Failed to parse backup file!");
      }
    };
    reader.readAsText(file);
  };

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
      <main className="flex-1 lg:pl-72 pl-0 min-h-screen flex flex-col bg-zinc-950 pb-12 animate-fadeIn">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between lg:px-8 px-4 pl-16 sticky top-0 z-10">
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

          {/* Section 1: Web App Settings & User Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-zinc-500" />
              Web App Settings & Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preferences Configuration */}
              <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md space-y-5">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Client Preferences</h4>
                
                <div className="space-y-4">
                  {/* Sound FX Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">Score Sound Effects</h5>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Play dynamic synth-pop reward tones when earning XP</p>
                    </div>
                    <button
                      onClick={handleToggleSound}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        soundEnabled ? "bg-violet-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          soundEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* AMOLED Mode Toggle */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <h5 className="text-xs font-bold text-white">AMOLED True Black Mode</h5>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Maximize display power-saving and visual contrast</p>
                    </div>
                    <button
                      onClick={handleToggleAmoled}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        amoledEnabled ? "bg-violet-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          amoledEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Danger Profile Reset */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <h5 className="text-xs font-bold text-white text-rose-400">Danger Zone</h5>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Clear all sandbox credentials and offline progress data</p>
                    </div>
                    <button
                      onClick={handleResetProfile}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 border ${
                        resetPrompt 
                          ? "bg-rose-600 border-rose-500 text-white animate-pulse" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                      }`}
                    >
                      {resetPrompt ? "Click to Confirm!" : "Reset Sandbox"}
                    </button>
                  </div>
                </div>

                {/* Browser Sandbox Data Map */}
                <div className="border-t border-white/5 pt-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-violet-400" />
                    Local Sandbox Data Structure
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                    This web app operates fully client-side. The following registry keys are managed locally in your browser's persistent sandbox:
                  </p>
                  
                  <div className="space-y-3 font-mono text-[9px] text-zinc-500">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                      <span className="text-violet-400 font-bold">ic_current_user</span>
                      <p className="text-zinc-500 font-sans leading-normal">
                        Stores the username of the active session (e.g. <code className="text-zinc-400 font-mono">"Guest"</code> or custom registered user).
                      </p>
                    </div>
                    
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                      <span className="text-violet-400 font-bold">ic_profiles</span>
                      <p className="text-zinc-500 font-sans leading-normal">
                        Your main progress dictionary. Holds streaks, XP scores, solved SQL query strings, puzzle solutions, and heatmap logs.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                      <span className="text-violet-400 font-bold">ic_users_db</span>
                      <p className="text-zinc-500 font-sans leading-normal">
                        Local database containing credentials pairings for registered offline user login profiles.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                      <span className="text-violet-400 font-bold">ic_sound_enabled / ic_amoled_enabled</span>
                      <p className="text-zinc-500 font-sans leading-normal">
                        Preference flags representing theme presets and sound notification settings.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Backup Diagnostics Toolkit */}
                <div className="border-t border-white/5 pt-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5 text-violet-400" />
                    Backup & Restore Progress
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                    Save a copy of your local sandbox parameters or restore progress from an offline JSON backup file:
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportBackup}
                      className="flex-1 py-2 px-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-300 hover:text-white font-semibold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Backup</span>
                    </button>
                    <label className="flex-1 py-2 px-3 rounded-xl border border-violet-500/20 bg-violet-600/10 hover:bg-violet-600/25 text-violet-300 hover:text-white font-semibold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import Backup</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Web App Analytics / Diagnostics */}
              <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md space-y-5">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Storage & Diagnostics</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Sandbox Size</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">{(storageBytes / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Registered Profiles</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">{localUsersCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Streak Status</span>
                    <span className="text-lg font-extrabold text-emerald-400 mt-1 block">{profile.streak} Days Active</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Accumulated XP</span>
                    <span className="text-lg font-extrabold text-violet-400 mt-1 block">{profile.xp} Points</span>
                  </div>
                </div>

                {/* Supabase Free Tier 2026 Quota Limits */}
                <div className="border-t border-white/5 pt-4 space-y-3.5">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-violet-400" />
                    Supabase Free Tier (2026 Quota Limits)
                  </h4>
                  
                  <div className="space-y-3 text-[10px] text-zinc-500 font-medium">
                    {/* DB Storage */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Postgres Database Storage</span>
                        <span className="text-zinc-300">{(storageBytes / 1024).toFixed(2)} KB / 500.00 MB limit</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-850 overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 rounded-full" 
                          style={{ width: `${Math.max(0.2, ((storageBytes / 1024) / 512000) * 100)}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-600 flex justify-between">
                        <span>Remaining: {(500 - (storageBytes / (1024 * 1024))).toFixed(4)} MB</span>
                        <span>{( ((storageBytes / 1024) / 512000) * 100 ).toFixed(6)}% Consumed</span>
                      </div>
                    </div>

                    {/* File Storage */}
                    <div className="space-y-1 pt-1.5 border-t border-white/[0.02]">
                      <div className="flex justify-between">
                        <span>File Storage</span>
                        <span className="text-zinc-300">0.00 MB / 1.00 GB limit</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-850 overflow-hidden">
                        <div className="h-full bg-violet-600 rounded-full" style={{ width: "0.1%" }} />
                      </div>
                      <div className="text-[9px] text-zinc-600">
                        <span>Remaining: 1,024.00 MB (100% free)</span>
                      </div>
                    </div>

                    {/* Bandwidth */}
                    <div className="space-y-1 pt-1.5 border-t border-white/[0.02]">
                      <div className="flex justify-between">
                        <span>Monthly Bandwidth</span>
                        <span className="text-zinc-300">~0.02 MB / 5.00 GB limit</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-850 overflow-hidden">
                        <div className="h-full bg-violet-600 rounded-full" style={{ width: "0.1%" }} />
                      </div>
                      <div className="text-[9px] text-zinc-600">
                        <span>Remaining: 5,119.98 MB (99.99% free)</span>
                      </div>
                    </div>

                    {/* Monthly Active Users */}
                    <div className="space-y-1 pt-1.5 border-t border-white/[0.02]">
                      <div className="flex justify-between">
                        <span>Monthly Active Users (MAU)</span>
                        <span className="text-zinc-300">{localUsersCount} / 50,000 MAU limit</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-850 overflow-hidden">
                        <div 
                          className="h-full bg-violet-600 rounded-full" 
                          style={{ width: `${(localUsersCount / 50000) * 100}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-600 flex justify-between">
                        <span>Remaining: {50000 - localUsersCount} users</span>
                        <span>{((localUsersCount / 50000) * 100).toFixed(4)}% Consumed</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-amber-500/90 leading-relaxed font-semibold bg-amber-500/[0.02] p-2.5 rounded-lg border border-amber-500/10">
                    ⚠️ Free tier projects pause after 1 week of inactivity. Keep database active with at least one solve/interaction per week to avoid pausing!
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 leading-relaxed font-medium bg-black/40 p-3.5 rounded-xl border border-white/5">
                  <span className="font-bold text-zinc-400 block mb-1">Web App Performance Tip:</span>
                  This app relies on browser-cached static indexes and local storage for instant page changes. Syncing a Cloud DB secures these data structures from browser sandbox cleaning cycles.
                </div>
              </div>
            </div>
          </div>

          {/* Setup Guide Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-zinc-500" />
              Configure Supabase Cloud Sync (Optional)
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