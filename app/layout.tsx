import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview Coach — Master Coding & SQL",
  description: "Ultimate dashboard to track DSA, Competitive Programming, SQL, and puzzles with automated APIs validation.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><linearGradient id=%22glow%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22><stop offset=%220%25%22 stop-color=%22%23a855f7%22/><stop offset=%22100%25%22 stop-color=%22%2306b6d4%22/></linearGradient></defs><rect x=%225%22 y=%225%22 width=%2290%22 height=%2290%22 rx=%2224%22 fill=%22none%22 stroke=%22url(%23glow)%22 stroke-width=%228%22/><rect x=%229%22 y=%229%22 width=%2282%22 height=%2282%22 rx=%2220%22 fill=%22%2309090b%22/><path d=%22M58 18 L28 53 H48 L40 82 L72 47 H52 Z%22 fill=%22url(%23glow)%22/></svg>",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
