import { createClient } from "@supabase/supabase-js";
import { standardProblems } from "./apiSync";

// safe initialization of Supabase client with strict placeholder checks
const supabaseUrl = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_SUPABASE_URL || "") : "";
const supabaseAnonKey = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "") : "";

const isValidSupabaseConfig = (url: string, key: string) => {
  if (!url || !key) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (url.includes("your-project-id")) return false;
  if (key.includes("your-anonymous-anon-public-key")) return false;
  return true;
};

export const supabase = isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface TimedSession {
  id: string;
  title: string;
  linkOrId: string;
  platform: "LeetCode" | "Codeforces" | "GeeksforGeeks" | "SQL" | "Puzzles" | "Other";
  difficulty: "Easy" | "Medium" | "Hard";
  timeSpentSeconds: number;
  solvedAt: string; // YYYY-MM-DD
}

export interface UserProfile {
  username: string;
  cfHandle?: string;
  lcHandle?: string;
  streak: number;
  lastActiveDate?: string;
  xp: number;
  solvedList: string[]; // List of problem IDs solved
  solvedPuzzles: string[]; // List of puzzle IDs solved
  solvedSql: string[]; // List of SQL problem IDs solved
  solvedPuzzleAnswers?: Record<string, string>; // puzzleId -> selectedOption
  solvedSqlAnswers?: Record<string, string>; // sqlProblemId -> submittedSQLQuery
  solvedCustomCount: number; // Manually added problem solves
  activityLog: Record<string, number>; // YYYY-MM-DD -> solve count
  timedSessions?: TimedSession[]; // List of timed practice sessions
}

const DEFAULT_ACTIVITY: Record<string, number> = {};

// Helper to pre-seed realistic historic activity data
const seedMockActivity = () => {
  const log: Record<string, number> = {};
  const today = new Date();
  for (let i = 45; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    // Seed ~40% of the days with random solves between 1 and 4
    if (Math.random() > 0.6) {
      log[dateStr] = Math.floor(Math.random() * 3) + 1;
    }
  }
  return log;
};

// Helper to seed standard mock timed sessions
const seedMockTimedSessions = (): TimedSession[] => {
  const sessions: TimedSession[] = [];
  const today = new Date();

  const templates: Array<{
    title: string;
    linkOrId: string;
    platform: "LeetCode" | "Codeforces" | "GeeksforGeeks" | "SQL" | "Puzzles" | "Other";
    difficulty: "Easy" | "Medium" | "Hard";
    baseTime: number; // in seconds
  }> = [
      { title: "Two Sum", linkOrId: "https://leetcode.com/problems/two-sum/", platform: "LeetCode", difficulty: "Easy", baseTime: 720 },
      { title: "Watermelon", linkOrId: "4A", platform: "Codeforces", difficulty: "Easy", baseTime: 540 },
      { title: "Duplicate Emails", linkOrId: "duplicate-emails", platform: "SQL", difficulty: "Easy", baseTime: 420 },
      { title: "Valid Parentheses", linkOrId: "https://leetcode.com/problems/valid-parentheses/", platform: "LeetCode", difficulty: "Easy", baseTime: 360 },
      { title: "Cut Ribbon", linkOrId: "189A", platform: "Codeforces", difficulty: "Medium", baseTime: 1450 },
      { title: "9 Balls Weight Puzzle", linkOrId: "9-balls-weight", platform: "Puzzles", difficulty: "Medium", baseTime: 980 }
    ];

  templates.forEach((tpl, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (15 - i * 2.5));
    const dateStr = d.toISOString().split("T")[0];

    const variation = Math.floor(Math.random() * 40) - 20; // +/- 20s
    const improvementFactor = 1 - (i * 0.08); // Up to 40% speed improvement
    const finalTime = Math.max(120, Math.floor(tpl.baseTime * improvementFactor) + variation);

    sessions.push({
      id: `mock-ts-${i}`,
      title: tpl.title,
      linkOrId: tpl.linkOrId,
      platform: tpl.platform,
      difficulty: tpl.difficulty,
      timeSpentSeconds: finalTime,
      solvedAt: dateStr
    });
  });

  return sessions;
};

const DEFAULT_PROFILE: UserProfile = {
  username: "Guest",
  streak: 5,
  xp: 320,
  solvedList: ["lc-two-sum", "cf-watermelon"], // Seed 2 solved problems initially
  solvedPuzzles: ["9-balls-weight"], // Seed 1 solved puzzle
  solvedSql: ["duplicate-emails"], // Seed 1 solved SQL
  solvedCustomCount: 0,
  activityLog: seedMockActivity(),
  timedSessions: seedMockTimedSessions()
};

const STORAGE_KEYS = {
  CURRENT_USER: "ic_current_user",
  USERS_DB: "ic_users_db",
  PROFILES: "ic_profiles"
};

// In-memory cache for profiles during active session
const cachedProfiles: Record<string, UserProfile> = {};

export function getLoggedInUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

export function setLoggedInUser(username: string | null) {
  if (typeof window === "undefined") return;
  if (username) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

/**
 * Returns user profile instantly from memory or local cache,
 * then triggers a background fetch to Supabase to update / migrate data if cloud mode is enabled.
 */
export function getUserProfile(username: string): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;

  // Return in-memory cache if available
  if (cachedProfiles[username]) {
    return cachedProfiles[username];
  }

  const profilesRaw = localStorage.getItem(STORAGE_KEYS.PROFILES);
  const profiles = profilesRaw ? JSON.parse(profilesRaw) : {};

  if (!profiles[username]) {
    profiles[username] = { ...DEFAULT_PROFILE, username };
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  }

  // Seed cache
  cachedProfiles[username] = profiles[username];

  // Trigger background cloud sync/migration
  if (supabase) {
    syncWithSupabase(username, profiles[username]);
  }

  return profiles[username];
}

/**
 * Handles the bidirectional background synchronization and migration with Supabase.
 */
async function syncWithSupabase(username: string, localProfile: UserProfile) {
  try {
    const { data: cloudProfile, error } = await supabase!
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Supabase profile select error:", error);
      return;
    }

    if (!cloudProfile) {
      // 1. MIGRATION / INITIAL PUSH: Local progress doesn't exist in Supabase yet.
      console.log(`Migrating/Pushing profile for "${username}" to Supabase cloud...`);
      await pushProfileToSupabase(localProfile);
    } else {
      // 2. BIDIRECTIONAL SYNC: Compare progress metrics (XP decides which database has newer/more progress)
      const cloudXP = cloudProfile.xp || 0;
      const localXP = localProfile.xp || 0;

      if (localXP > cloudXP) {
        // Local has more solved progress (perhaps solved offline). Push/update cloud.
        console.log(`Syncing up: Local has more XP (${localXP} > ${cloudXP}). Updating Supabase...`);
        await pushProfileToSupabase(localProfile);
      } else if (cloudXP > localXP) {
        // Cloud has more solved progress (perhaps solved on another device). Pull down.
        console.log(`Syncing down: Supabase has more XP (${cloudXP} > ${localXP}). Overwriting local storage...`);

        const pulledProfile: UserProfile = {
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

        // Update local storage and cache
        const profilesRaw = localStorage.getItem(STORAGE_KEYS.PROFILES);
        const profiles = profilesRaw ? JSON.parse(profilesRaw) : {};
        profiles[username] = pulledProfile;
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
        cachedProfiles[username] = pulledProfile;

        // Sync password from cloud to local credentials DB
        if (cloudProfile.password) {
          const usersRaw = localStorage.getItem("ic_users_db") || "{}";
          const users = JSON.parse(usersRaw);
          users[username.toLowerCase()] = cloudProfile.password;
          localStorage.setItem("ic_users_db", JSON.stringify(users));
        }

        // Dispatch a custom event to notify React components to re-render
        window.dispatchEvent(new Event("profile_updated"));
      } else {
        // XP is equal, check if we need to sync password to cloud or update handles
        const usersRaw = localStorage.getItem("ic_users_db") || "{}";
        const users = JSON.parse(usersRaw);
        const localPassword = users[username.toLowerCase()];

        if (localPassword && !cloudProfile.password) {
          console.log(`Pushing password for "${username}" to Supabase cloud...`);
          await pushProfileToSupabase(localProfile);
        } else if (cloudProfile.cf_handle !== localProfile.cfHandle || cloudProfile.lc_handle !== localProfile.lcHandle) {
          const mergedProfile = {
            ...localProfile,
            cfHandle: cloudProfile.cf_handle || localProfile.cfHandle,
            lcHandle: cloudProfile.lc_handle || localProfile.lcHandle
          };
          cachedProfiles[username] = mergedProfile;
          const profilesRaw = localStorage.getItem(STORAGE_KEYS.PROFILES);
          const profiles = profilesRaw ? JSON.parse(profilesRaw) : {};
          profiles[username] = mergedProfile;
          localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

          window.dispatchEvent(new Event("profile_updated"));
        }
      }
    }
  } catch (err) {
    console.error("Supabase sync exception:", err);
  }
}

/**
 * Pushes the local profile state up to Supabase using a single upsert transaction.
 */
async function pushProfileToSupabase(profile: UserProfile) {
  if (!supabase) return;

  const usersRaw = typeof window !== "undefined" ? (localStorage.getItem("ic_users_db") || "{}") : "{}";
  const users = JSON.parse(usersRaw);
  const localPassword = users[profile.username.toLowerCase()] || null;

  const { error } = await supabase
    .from("profiles")
    .upsert({
      username: profile.username,
      cf_handle: profile.cfHandle || null,
      lc_handle: profile.lcHandle || null,
      streak: profile.streak,
      last_active_date: profile.lastActiveDate || null,
      xp: profile.xp,
      solved_list: profile.solvedList,
      solved_puzzles: profile.solvedPuzzles,
      solved_sql: profile.solvedSql,
      solved_custom_count: profile.solvedCustomCount,
      solved_puzzle_answers: profile.solvedPuzzleAnswers || {},
      solved_sql_answers: profile.solvedSqlAnswers || {},
      activity_log: profile.activityLog,
      timed_sessions: profile.timedSessions || [],
      password: localPassword
    });

  if (error) {
    console.error("Failed to push profile to Supabase:", error.message);
  } else {
    console.log("Successfully synchronized profile to Supabase cloud.");
  }
}

export function saveUserProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;

  // Re-calculate streak
  const updatedProfile = calculateStreak(profile);

  // Update memory cache
  cachedProfiles[profile.username] = updatedProfile;

  // Update local storage
  const profilesRaw = localStorage.getItem(STORAGE_KEYS.PROFILES);
  const profiles = profilesRaw ? JSON.parse(profilesRaw) : {};
  profiles[profile.username] = updatedProfile;
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

  // Background push to Supabase Cloud
  if (supabase) {
    pushProfileToSupabase(updatedProfile);
  }
}

/**
 * Helper to get a local date string in YYYY-MM-DD format (timezone safe)
 */
export function getLocalTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Helper to resolve the XP payout based on solved problem difficulty
 */
function getXPByDifficulty(difficulty: "Easy" | "Medium" | "Hard"): number {
  switch (difficulty) {
    case "Easy": return 5;
    case "Medium": return 10;
    case "Hard": return 15;
    default: return 10;
  }
}

/**
 * Triggers a solve record update. Increases XP based on difficulty, adds to solved array, updates activityLog.
 */
export function recordSolve(
  username: string,
  itemType: "problem" | "puzzle" | "sql" | "custom",
  itemId: string,
  answer?: string
) {
  const profile = getUserProfile(username);
  const todayStr = getLocalTodayStr();

  let isNewSolve = false;
  let resolvedDiff: "Easy" | "Medium" | "Hard" = "Medium";

  if (itemType === "problem") {
    if (!profile.solvedList.includes(itemId)) {
      profile.solvedList.push(itemId);
      
      // Resolve difficulty
      const matched = standardProblems.find(p => p.id === itemId);
      if (matched) {
        resolvedDiff = matched.difficulty;
      } else if (itemId.startsWith("cf-")) {
        const parts = itemId.split("-");
        const index = parts[parts.length - 1]?.toUpperCase() || "";
        if (["A", "B"].includes(index.charAt(0))) resolvedDiff = "Easy";
        else if (["C", "D"].includes(index.charAt(0))) resolvedDiff = "Medium";
        else resolvedDiff = "Hard";
      }
      
      profile.xp += getXPByDifficulty(resolvedDiff);
      isNewSolve = true;
    }
  } else if (itemType === "puzzle") {
    if (!profile.solvedPuzzles.includes(itemId)) {
      profile.solvedPuzzles.push(itemId);
      
      // Resolve puzzle difficulty
      if (itemId.includes("weight") || itemId.includes("matchstick")) resolvedDiff = "Medium";
      else if (itemId.includes("hard") || itemId.includes("chess")) resolvedDiff = "Hard";
      else resolvedDiff = "Easy";
      
      profile.xp += getXPByDifficulty(resolvedDiff);
      isNewSolve = true;
    }
    if (answer) {
      if (!profile.solvedPuzzleAnswers) profile.solvedPuzzleAnswers = {};
      profile.solvedPuzzleAnswers[itemId] = answer;
      isNewSolve = true; // force save/update
    }
  } else if (itemType === "sql") {
    if (!profile.solvedSql.includes(itemId)) {
      profile.solvedSql.push(itemId);
      
      // Resolve SQL difficulty
      if (itemId.includes("hard") || itemId.includes("department-top")) resolvedDiff = "Hard";
      else if (itemId.includes("easy") || itemId.includes("duplicate")) resolvedDiff = "Easy";
      else resolvedDiff = "Medium";
      
      profile.xp += getXPByDifficulty(resolvedDiff);
      isNewSolve = true;
    }
    if (answer) {
      if (!profile.solvedSqlAnswers) profile.solvedSqlAnswers = {};
      profile.solvedSqlAnswers[itemId] = answer;
      isNewSolve = true; // force save/update
    }
  } else if (itemType === "custom") {
    profile.solvedCustomCount += 1;
    profile.xp += getXPByDifficulty("Medium"); // default custom to Medium
    isNewSolve = true;
  }

  if (isNewSolve) {
    profile.activityLog[todayStr] = (profile.activityLog[todayStr] || 0) + 1;
    saveUserProfile(profile);
  }
}

/**
 * Triggers a timed practice session solve record update.
 * Increases XP based on difficulty, logs the session, updates the activity log, and saves the profile.
 */
export function recordTimedSession(
  username: string,
  sessionData: {
    title: string;
    linkOrId: string;
    platform: "LeetCode" | "Codeforces" | "GeeksforGeeks" | "SQL" | "Puzzles" | "Other";
    difficulty: "Easy" | "Medium" | "Hard";
    timeSpentSeconds: number;
  }
) {
  const profile = getUserProfile(username);
  const todayStr = getLocalTodayStr();

  if (!profile.timedSessions) {
    profile.timedSessions = [];
  }

  const newSession: TimedSession = {
    id: `ts-${Date.now()}`,
    title: sessionData.title || "Untitled Problem",
    linkOrId: sessionData.linkOrId || "None",
    platform: sessionData.platform,
    difficulty: sessionData.difficulty,
    timeSpentSeconds: sessionData.timeSpentSeconds,
    solvedAt: todayStr
  };

  profile.timedSessions.push(newSession);
  profile.xp += getXPByDifficulty(sessionData.difficulty || "Medium");

  // Register solve in contribution activity heatmap
  profile.activityLog[todayStr] = (profile.activityLog[todayStr] || 0) + 1;

  saveUserProfile(profile);
}

/**
 * Calculates current active streak based on consecutive daily activities.
 */
function calculateStreak(profile: UserProfile): UserProfile {
  const activityLog = profile.activityLog || {};
  const dates = Object.keys(activityLog).filter(d => activityLog[d] > 0).sort();

  if (dates.length === 0) {
    profile.streak = 0;
    return profile;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const hasSolvedRecently = activityLog[todayStr] > 0 || activityLog[yesterdayStr] > 0;
  if (!hasSolvedRecently) {
    profile.streak = 0;
    return profile;
  }

  let streak = 0;
  let currentCheck = new Date(today);

  if (!(activityLog[todayStr] > 0)) {
    currentCheck = new Date(yesterday);
  }

  while (true) {
    const checkStr = currentCheck.toISOString().split("T")[0];
    if (activityLog[checkStr] > 0) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1); // move back 1 day
    } else {
      break;
    }
  }

  profile.streak = streak;
  profile.lastActiveDate = dates[dates.length - 1];
  return profile;
}
