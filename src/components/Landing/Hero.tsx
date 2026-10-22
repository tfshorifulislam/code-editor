import React from "react";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="landing-section overflow-hidden pt-12 pb-10 sm:pt-20 sm:pb-14">
      {/* Subtle radial ambient background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="w-[800px] h-[360px] bg-gradient-to-b from-[var(--color-accent-soft)] via-[var(--color-accent-soft)]/40 to-transparent blur-3xl rounded-full opacity-80" />
      </div>

      <div className="landing-container text-center">
        {/* Announcement Badge */}
        <div className="landing-eyebrow mb-6 sm:mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span>Meet your new AI coding workspace</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
        </div>

        {/* Headline */}
        <h1 className="landing-hero-title max-w-4xl mx-auto">
          Your ideas deserve{" "}
          <span className="relative inline-block text-[var(--color-accent)]">
            better code.
            <span
              className="absolute -bottom-1 left-0 w-full h-[3px] bg-[var(--color-accent)]/30 rounded-full"
              aria-hidden="true"
            />
          </span>
        </h1>

        {/* Description */}
        <p className="landing-paragraph mt-6 max-w-2xl mx-auto">
          Write, build, and ship projects faster with an intelligent AI coding
          assistant built right into your workspace.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <a
            href="#editor-demo"
            className="landing-button-primary w-full sm:w-auto"
          >
            <span>Start Coding Free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#features"
            className="landing-button-secondary w-full sm:w-auto"
          >
            Explore Features
          </a>
        </div>

        {/* Trust text */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm landing-muted">
          <span className="font-medium text-[var(--color-foreground)]">
            Write code. Build projects. Let AI handle the busywork.
          </span>
          <div className="hidden sm:flex items-center gap-4 text-neutral-400">
            <span>•</span>
            <span className="inline-flex items-center gap-1 landing-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
              In-browser IDE
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 landing-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
              No installation needed
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
