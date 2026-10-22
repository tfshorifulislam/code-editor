import React from "react";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 sm:pt-20 sm:pb-14">
      {/* Subtle radial ambient background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="w-[800px] h-[360px] bg-gradient-to-b from-[#F3F0FF] via-[#F3F0FF]/40 to-transparent blur-3xl rounded-full opacity-80" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-[#F3F0FF] text-[#6C5CE7] border border-[#6C5CE7]/20 shadow-xs mb-6 sm:mb-8 transition-all hover:border-[#6C5CE7]/40">
          <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
          <span>Meet your new AI coding workspace</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-pulse" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#171717] leading-[1.08] max-w-4xl mx-auto">
          Your ideas deserve{" "}
          <span className="relative inline-block text-[#6C5CE7]">
            better code.
            <span
              className="absolute -bottom-1 left-0 w-full h-[3px] bg-[#6C5CE7]/30 rounded-full"
              aria-hidden="true"
            />
          </span>
        </h1>

        {/* Description */}
        <p className="mt-6 text-lg sm:text-xl text-[#666666] max-w-2xl mx-auto leading-relaxed font-normal">
          Write, build, and ship projects faster with an intelligent AI coding
          assistant built right into your workspace.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <a
            href="#editor-demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-[#6C5CE7] hover:bg-[#5b4cc4] px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2"
          >
            <span>Start Coding Free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-medium text-[#171717] bg-white hover:bg-neutral-50 border border-[#EAEAEA] hover:border-neutral-300 px-6 py-3.5 rounded-xl shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            Explore Features
          </a>
        </div>

        {/* Trust text */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm text-[#666666]">
          <span className="font-medium text-[#171717]">
            Write code. Build projects. Let AI handle the busywork.
          </span>
          <div className="hidden sm:flex items-center gap-4 text-neutral-400">
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[#666666]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              In-browser IDE
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[#666666]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              No installation needed
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

