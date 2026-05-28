"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Database,
  Puzzle,
  BarChart3,
  LogOut,
  Terminal,
  Code,
  Flame,
  Award,
  UserCheck,
  Timer,
  Settings
} from "lucide-react";
import { getLoggedInUser, getUserProfile, UserProfile } from "@/lib/db";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      // Force redirect to login if not authenticated and not on landing page
      if (pathname !== "/" && pathname !== "/login" && pathname !== "/signup") {
        router.push("/login");
      }
    } else {
      setUser(loggedIn);
      setProfile(getUserProfile(loggedIn));
    }
  }, [pathname, router]);

  // Listen to profile updates (e.g. XP / solve updates)
  useEffect(() => {
    if (!user) return;
    const handleStorageChange = () => {
      setProfile(getUserProfile(user));
    };

    window.addEventListener("storage", handleStorageChange);
    // Poll local changes briefly every few seconds to keep XP/streak live
    const interval = setInterval(handleStorageChange, 1500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("ic_current_user");
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Problems Tracker", path: "/practice", icon: Code },
    { name: "Timed Practice", path: "/timer", icon: Timer },
    { name: "SQL Playground", path: "/sql", icon: Terminal },
    { name: "Logical Puzzles", path: "/puzzles", icon: Puzzle },
    { name: "Analytics Dashboard", path: "/analytics", icon: BarChart3 },
    { name: "Settings & Cloud Sync", path: "/settings", icon: Settings }
  ];

  if (!user || !profile) {
    return null; // Don't show sidebar for public routes
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl text-zinc-100">
      {/* App Branding */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 font-bold text-white shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform duration-300">
            <h1 className="w-full text-center text-xl font-bold text-white whitespace-nowrap">
              Interview Coach
            </h1>
          </div>
          <span className="font-semibold text-lg bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Interview Coach
          </span>
        </Link>
      </div>

      {/* Gamification Profile Status Box */}
      <div className="p-5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-white/10 text-violet-400 font-bold">
            {profile.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate text-white">{profile.username}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-zinc-400 truncate">
                {profile.cfHandle || profile.lcHandle ? "Handles Synced" : "Local Practice"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex flex-col p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 items-center justify-center text-center">
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="h-4.5 w-4.5 fill-current animate-pulse" />
              <span className="font-bold text-sm">{profile.streak}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mt-1">Day Streak</span>
          </div>

          <div className="flex flex-col p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 items-center justify-center text-center">
            <div className="flex items-center gap-1 text-yellow-400">
              <Award className="h-4.5 w-4.5 fill-current" />
              <span className="font-bold text-sm">{profile.xp}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mt-1">XP Points</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive
                ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/5 border-l-4 border-violet-500 text-white shadow-inner"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-violet-400" : "text-zinc-400 group-hover:text-white"
                }`} />
              <span>{item.name}</span>
              {isActive && (
                <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/5 bg-zinc-950">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout Coach</span>
        </button>
      </div>
    </aside>
  );
}
