import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniCodeTrack AI — Academic Project & Hackathon Management Platform",
  description:
    "From classroom projects to hackathon competitions — build, track, and evaluate with AI. A unified academic workspace for universities, lecturers, and student teams.",
  keywords: [
    "academic project management",
    "hackathon platform",
    "university SaaS",
    "GitHub student tracking",
    "AI evaluation",
    "milestone tracking",
  ],
  authors: [{ name: "UniCodeTrack AI Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0B1220] selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
