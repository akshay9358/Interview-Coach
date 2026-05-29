"use client";

import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Puzzle as PuzzleIcon, 
  HelpCircle, 
  CheckCircle, 
  Info, 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Award,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { 
  getLoggedInUser, 
  getUserProfile, 
  recordSolve, 
  UserProfile,
  getSolvedDate
} from "@/lib/db";
import { puzzles, Puzzle, generateDynamicPuzzle } from "@/lib/puzzleData";

export default function PuzzlesSection() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<Puzzle>(puzzles[0]);
  const [userAnswer, setUserAnswer] = useState("");
  const [showHintIndex, setShowHintIndex] = useState<number>(-1);
  const [isWrongAnswer, setIsWrongAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [showSolvedPuzzles, setShowSolvedPuzzles] = useState(false);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setProfile(getUserProfile(user));
    }

    const handleUpdate = () => {
      if (user) {
        setProfile(getUserProfile(user));
      }
    };

    window.addEventListener("profile_updated", handleUpdate);
    return () => {
      window.removeEventListener("profile_updated", handleUpdate);
    };
  }, []);

  // Dynamically extend puzzles list so we always show at least 10 unsolved puzzles
  const displayPuzzles = useMemo(() => {
    if (!profile) return puzzles;
    const list = [...puzzles];
    let unsolvedCount = list.filter(p => !profile.solvedPuzzles.includes(p.id)).length;
    
    let i = 0;
    while (unsolvedCount < 10 && i < 100) { // safety cap of 100
      const newId = `dyn-puz-${i}`;
      if (!puzzles.some(p => p.id === newId)) {
        const puz = generateDynamicPuzzle(i, newId);
        if (!profile.solvedPuzzles.includes(puz.id)) {
          list.push(puz);
          unsolvedCount++;
        }
      }
      i++;
    }
    return list;
  }, [profile]);

  // Restore selected puzzle from localStorage on mount/profile load
  useEffect(() => {
    const savedId = localStorage.getItem("ic_selected_puzzle_id");
    if (savedId && displayPuzzles.length > 0) {
      const matched = displayPuzzles.find(p => p.id === savedId);
      if (matched) {
        setActivePuzzle(matched);
      }
    }
  }, [displayPuzzles]);

  const handleSelectPuzzle = (puz: Puzzle) => {
    setActivePuzzle(puz);
    localStorage.setItem("ic_selected_puzzle_id", puz.id);
  };

  // Update states when selected puzzle changes - do not auto-fill userAnswer with saved answer
  useEffect(() => {
    setUserAnswer("");
    setShowHintIndex(-1);
    setIsWrongAnswer(false);
    setShowExplanation(false);
    setSuccessToast(false);
  }, [activePuzzle]);

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsWrongAnswer(false);
    
    // Normalize input answer and check against correctAnswers list
    const normalizedInput = userAnswer.trim().toLowerCase();
    const isCorrect = activePuzzle.correctAnswers.some(ans => 
      normalizedInput.includes(ans.toLowerCase()) || 
      ans.toLowerCase().includes(normalizedInput)
    );

    if (isCorrect) {
      recordSolve(profile.username, "puzzle", activePuzzle.id, userAnswer);
      setProfile(getUserProfile(profile.username));
      setSuccessToast(true);
      setShowExplanation(true);
    } else {
      setIsWrongAnswer(true);
    }
  };

  const handleRevealSolution = () => {
    setShowExplanation(true);
    if (isSolved && profile) {
      setUserAnswer(profile.solvedPuzzleAnswers?.[activePuzzle.id] || "");
    }
  };

  if (!profile) return null;

  const isSolved = profile.solvedPuzzles.includes(activePuzzle.id);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content viewport */}
      <main className="flex-1 pl-72 min-h-screen flex flex-col bg-zinc-950 pb-12">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Logic & Quant Puzzles
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Solve brainteasers and logical probability riddles asked in elite quant & tech interviews.</p>
          </div>
        </header>

        {/* Inner layout details */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl w-full mx-auto">
          
          {/* Left Column: Puzzle Lists Selector (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">Trending Quant Puzzles</span>
              
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {/* Unsolved puzzles */}
                {displayPuzzles.filter(puz => !profile.solvedPuzzles.includes(puz.id)).map((puz) => {
                  const active = activePuzzle.id === puz.id;
                  return (
                    <button
                      key={puz.id}
                      onClick={() => handleSelectPuzzle(puz)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex justify-between items-center transition-all ${
                        active
                          ? "bg-violet-600/20 text-violet-300 border border-violet-500/20 shadow-inner"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      <span className="truncate pr-2">{puz.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8px] px-1.5 py-0.5 rounded border border-white/5 bg-black/40 text-zinc-500">
                          {puz.category}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold ${
                          puz.difficulty === "Easy" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                          puz.difficulty === "Medium" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                          "border-rose-500/20 text-rose-400 bg-rose-500/5"
                        }`}>
                          {puz.difficulty}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Collapsible Solved Puzzles Dropdown */}
                {displayPuzzles.filter(puz => profile.solvedPuzzles.includes(puz.id)).length > 0 && (
                  <div className="mt-3 border-t border-white/5 pt-2">
                    <button
                      onClick={() => setShowSolvedPuzzles(!showSolvedPuzzles)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors select-none outline-none"
                    >
                      <span>Solved Puzzles ({displayPuzzles.filter(puz => profile.solvedPuzzles.includes(puz.id)).length})</span>
                      {showSolvedPuzzles ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    {showSolvedPuzzles && (
                      <div className="mt-1 space-y-1.5 pl-1 animate-fadeIn">
                        {displayPuzzles.filter(puz => profile.solvedPuzzles.includes(puz.id)).map((puz) => {
                          const active = activePuzzle.id === puz.id;
                          return (
                            <button
                              key={puz.id}
                              onClick={() => handleSelectPuzzle(puz)}
                              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex justify-between items-center transition-all ${
                                active
                                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20 shadow-inner"
                                  : "text-zinc-500 hover:text-white hover:bg-white/[0.01]"
                              }`}
                            >
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate pr-2 line-through text-zinc-600">{puz.title}</span>
                                <span className="text-[9px] text-zinc-500 font-normal mt-0.5">
                                  Solved on {getSolvedDate(profile, puz.id, "puzzle")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[8px] px-1.5 py-0.5 rounded border border-white/5 bg-black/40 text-zinc-500">
                                  {puz.category}
                                </span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold ${
                                  puz.difficulty === "Easy" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                  puz.difficulty === "Medium" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                                  "border-rose-500/20 text-rose-400 bg-rose-500/5"
                                }`}>
                                  {puz.difficulty}
                                </span>
                                <CheckCircle className="h-4 w-4 text-emerald-400 fill-emerald-500/10 shrink-0" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Streaks progress trackers */}
            <div className="p-5 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Puzzle Solver Streak</span>
              <div className="flex justify-center items-baseline gap-1 text-white">
                <span className="text-3xl font-extrabold">{profile.solvedPuzzles.length}</span>
                <span className="text-zinc-500 text-xs">/ {displayPuzzles.length} completed</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${(profile.solvedPuzzles.length / displayPuzzles.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Interactive riddle details (col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md space-y-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 h-32 w-32 bg-orange-600/[0.02] rounded-full blur-2xl pointer-events-none" />

              {/* Puzzle Header metadata */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <PuzzleIcon className="h-3.5 w-3.5" />
                  {activePuzzle.category}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  activePuzzle.difficulty === "Easy" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                  activePuzzle.difficulty === "Medium" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                  "border-rose-500/20 text-rose-400 bg-rose-500/5"
                }`}>
                  {activePuzzle.difficulty}
                </span>
              </div>

              {/* Description Statement */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white leading-tight">{activePuzzle.title}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-line">
                  {activePuzzle.description}
                </p>
              </div>

              {/* Sequential hints reveal */}
              <div className="space-y-3 pt-6 border-t border-white/5">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Need a clue? (Sequential Hints)</h4>
                
                <div className="flex flex-wrap gap-2">
                  {activePuzzle.hints.map((hint, idx) => (
                    <button
                      key={idx}
                      onClick={() => setShowHintIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all select-none border ${
                        showHintIndex >= idx
                          ? "bg-violet-600/10 border-violet-500/30 text-violet-400"
                          : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      Show Hint {idx + 1}
                    </button>
                  ))}
                </div>

                {showHintIndex >= 0 && (
                  <div className="p-4 rounded-xl border border-white/5 bg-black/40 text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5 animate-fadeIn">
                    <Info className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                    <span>{activePuzzle.hints[showHintIndex]}</span>
                  </div>
                )}
              </div>

              {/* Answer submission interface */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Submit Your Answer</h4>
                
                {isSolved && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm mb-4 animate-fadeIn">
                    <CheckCircle className="h-5 w-5 fill-emerald-500/10" />
                    <div className="flex-1 font-semibold">
                      Correct Answer! You have already solved this puzzle.
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md font-bold flex items-center gap-0.5 text-emerald-400">
                      <Award className="h-3 w-3 fill-current" />
                      <span>+30 XP</span>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePuzzle.options.map((option, idx) => {
                    const isSelected = userAnswer === option;
                    const wasWrongPick = isWrongAnswer && isSelected;
                    
                    const isCorrectOption = activePuzzle.correctAnswers.some(ans =>
                      option.trim().toLowerCase() === ans.toLowerCase() ||
                      ans.toLowerCase().includes(option.trim().toLowerCase())
                    );
                    const isCorrectPick = isSelected && isCorrectOption;
                    const isSolvedPick = isCorrectPick || (showExplanation && isCorrectOption);

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setUserAnswer(option);
                          setIsWrongAnswer(false);

                          // Auto-check answer
                          const normalizedInput = option.trim().toLowerCase();
                          const isCorrect = activePuzzle.correctAnswers.some(ans =>
                            normalizedInput.includes(ans.toLowerCase()) ||
                            ans.toLowerCase().includes(normalizedInput)
                          );

                          if (isCorrect) {
                            recordSolve(profile!.username, "puzzle", activePuzzle.id, option);
                            setProfile(getUserProfile(profile!.username));
                            setSuccessToast(true);
                            setShowExplanation(true);
                          } else {
                            setIsWrongAnswer(true);
                          }
                        }}
                        className={`text-left px-4 py-3.5 rounded-xl border text-xs font-semibold transition-all select-none ${
                          isSolvedPick
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
                            : wasWrongPick
                              ? "border-red-500/30 bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                              : isSelected
                                ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                                : "border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.04] hover:border-white/10"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            isSolvedPick
                              ? "border-emerald-500/30 text-emerald-400"
                              : wasWrongPick
                                ? "border-red-500/30 text-red-400"
                                : isSelected
                                  ? "border-violet-500/30 text-violet-400"
                                  : "border-white/10 text-zinc-500"
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                          {isSolvedPick && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 ml-1" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isWrongAnswer && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs animate-shake">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>Incorrect answer. Review hints and check again, or reveal solution below!</span>
                  </div>
                )}
              </div>

              {/* Reveal Solution Button */}
              {!showExplanation && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleRevealSolution}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{isSolved ? "Show Saved Answer & Explanation" : "Reveal Explanation (Forfeits XP)"}</span>
                  </button>
                </div>
              )}

              {/* Success solved toast */}
              {successToast && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">Answer Verified! Solved logged. +30 XP Added.</span>
                </div>
              )}

              {/* Complete puzzle explanation section */}
              {showExplanation && (
                <div className="p-6 rounded-2xl border border-white/5 bg-black/40 space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-orange-400 fill-current" />
                    Correct Explanation & Logic
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line font-medium">
                    {activePuzzle.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
