"use client";

import React, { useEffect, useState } from "react";

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  gradientColors: {
    start: string;
    end: string;
  };
  id: string; // unique ID for SVG linearGradient
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  gradientColors,
  id
}: ProgressRingProps) {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Clamp progress between 0 and 1
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const progressOffset = circumference - clampedProgress * circumference;
    setOffset(progressOffset);
  }, [progress, circumference]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
        </defs>
        
        {/* Background Track Ring */}
        <circle
          className="text-zinc-900 border border-white/5"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        
        {/* Foreground Progress Ring */}
        <circle
          stroke={`url(#grad-${id})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      
      {/* Inner Label Content */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}
