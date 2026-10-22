import React from "react";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-[#F3F0FF] border border-[#6C5CE7]/25 p-8 sm:p-16 lg:p-20 text-center overflow-hidden shadow-lg">
          {/* Subtle Ambient Decorative Circles */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#6C5CE7]/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#6C5CE7]/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#6C5CE7] border border-[#6C5CE7]/20 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span>Ready When You Are</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#171717] leading-tight">
              Your next great project starts here.
            </h2>

            <p className="text-base sm:text-xl text-[#666666] max-w-2xl mx-auto leading-relaxed">
              Write, build, and ship code faster with an intelligent AI assistant
              built right into your browser. No downloads or installations required.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#editor-demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-[#6C5CE7] hover:bg-[#5b4cc4] px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2"
              >
                <span>Start Coding Free</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#editor-demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-medium text-[#171717] bg-white hover:bg-neutral-50 border border-[#EAEAEA] hover:border-neutral-300 px-6 py-4 rounded-xl shadow-2xs transition-all"
              >
                Explore Interactive Demo
              </a>
            </div>

            {/* Trust badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-[#666666]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Free forever tier
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Zero local setup
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No credit card needed
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

