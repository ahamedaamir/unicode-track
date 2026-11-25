import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
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
      className={`${inter.variable} ${fontMono.variable} dark h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-background">
        {children}
      </body>
    </html>
  );
}
