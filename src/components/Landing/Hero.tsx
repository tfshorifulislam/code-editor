import React from "react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-8 sm:pt-20 sm:pb-12 lg:pt-24 lg:pb-14 bg-[var(--color-background)]">
      {/* Subtle ambient decorative lavender glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="w-[720px] h-[340px] bg-gradient-to-b from-[var(--color-accent-soft)] via-[var(--color-accent-soft)]/50 to-transparent blur-3xl rounded-full opacity-75" />
      </div>

      <div className="landing-container text-center">
        {/* Announcement Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[var(--radius-pill)] text-xs sm:text-sm font-medium bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 shadow-xs mb-6 sm:mb-8 transition-all duration-200 hover:border-[var(--color-accent)]/40 hover:scale-[1.01]">
          <span>✦ Meet your new AI coding workspace</span>
        </div>

        {/* Main Headline */}
        <h1 className="landing-hero-title max-w-4xl mx-auto tracking-tight font-extrabold">
          Your ideas deserve{" "}
          <span className="bg-gradient-to-r from-[var(--color-primary)] via-[#806BFA] to-[var(--color-primary)] bg-clip-text text-transparent inline-block">
            better code.
          </span>
        </h1>

        {/* Supporting Description */}
        <p className="landing-paragraph mt-6 sm:mt-7 max-w-[620px] mx-auto text-base sm:text-lg leading-relaxed text-[var(--color-muted-foreground)]">
          Write, build, and ship projects faster with an intelligent AI coding
          assistant built right into your workspace.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <a
            href="#editor-demo"
            className="group landing-button-primary w-full sm:w-auto h-12 px-6 shadow-md hover:shadow-lg shadow-[var(--color-primary)]/20"
          >
            <span>Start Coding Free</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#features"
            className="landing-button-secondary w-full sm:w-auto h-12 px-6"
          >
            Explore Features
          </a>
        </div>

        {/* Subtle Trust Caption */}
        <p className="mt-7 sm:mt-8 text-xs sm:text-sm text-[var(--color-muted-foreground)] font-medium">
          Write code. Build projects. Let AI handle the busywork.
        </p>
      </div>
    </section>
  );
}
