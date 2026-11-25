"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { 
  Sparkles, 
  Menu, 
  X, 
  ArrowRight,
  Code2
} from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Academic Projects", href: "#academic-projects" },
    { name: "Hackathons", href: "#hackathons" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-xs border-b border-border"
          : "bg-background/80 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg p-1"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-[10px] bg-card border border-border text-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5 text-accent" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center ring-2 ring-background">
                <Sparkles className="w-2 h-2 text-background" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  UniCodeTrack
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  AI
                </span>
              </div>
              <span className="text-[10px] tracking-wide text-muted-foreground font-medium hidden sm:block">
                Academic & Hackathon Platform
              </span>
            </div>
          </Link>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-foreground transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-accent after:absolute after:bottom-0 after:left-0 after:transition-all"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right: Auth & Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-foreground hover:text-accent px-3.5 py-2 rounded-[10px] hover:bg-muted transition-colors border border-border"
            >
              Sign In
            </Link>
            <Button
              href="/register"
              variant="primary"
              size="md"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Register
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[10px] text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-foreground hover:text-accent py-2 px-3 rounded-[10px] hover:bg-muted transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-border flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-medium text-foreground rounded-[10px] border border-border hover:bg-muted"
            >
              Sign In
            </Link>
            <Button
              href="/register"
              variant="primary"
              size="md"
              className="w-full justify-center"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Register
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
