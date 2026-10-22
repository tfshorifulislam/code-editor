"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Code2, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Product", href: "#editor-demo" },
    { name: "Features", href: "#features" },
    { name: "AI Agent", href: "#ai-agent" },
    { name: "Languages", href: "#languages" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Documentation", href: "#faq" },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-[#EAEAEA] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] rounded-lg"
        >
          <div className="w-8 h-8 rounded-lg bg-[#6C5CE7] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Code2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#171717]">
            Code Editor
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-[#666666] hover:text-[#171717] px-3 py-1.5 rounded-md hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#editor-demo"
            className="text-sm font-medium text-[#666666] hover:text-[#171717] px-3 py-2 rounded-md hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
          >
            Sign In
          </a>
          <a
            href="#editor-demo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-[#6C5CE7] hover:bg-[#5b4cc4] px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2"
          >
            <span>Start Coding Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#666666] hover:text-[#171717] hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EAEAEA] bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#666666] hover:text-[#171717] px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-[#EAEAEA] flex flex-col gap-2">
            <a
              href="#editor-demo"
              onClick={handleLinkClick}
              className="w-full text-center text-sm font-medium text-[#666666] hover:text-[#171717] py-2.5 rounded-lg border border-[#EAEAEA] hover:bg-neutral-50 transition-colors"
            >
              Sign In
            </a>
            <a
              href="#editor-demo"
              onClick={handleLinkClick}
              className="w-full text-center text-sm font-medium text-white bg-[#6C5CE7] hover:bg-[#5b4cc4] py-2.5 rounded-lg shadow-sm transition-all"
            >
              Start Coding Free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

