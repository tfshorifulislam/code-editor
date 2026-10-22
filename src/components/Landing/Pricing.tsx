import React from "react";
import { Check, Sparkles, ArrowRight } from "lucide-react";

export default function Pricing() {
  const features = [
    "Browser-based code editing",
    "AI assistant with usage limits",
    "Basic project workspace",
    "Web preview where supported",
    "Multi-file project explorer & tab manager",
    "Syntax highlighting for 8+ major programming languages",
    "Integrated terminal and execution diagnostics",
  ];

  return (
    <section id="pricing" className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F3F0FF] text-[#6C5CE7] border border-[#6C5CE7]/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Honest & Transparent</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#171717]">
            Everything you need to get started.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#666666] leading-relaxed">
            Start coding immediately in your browser. All core editor tools and
            AI features are available with no upfront cost.
          </p>
        </div>

        {/* Single Free Plan Card */}
        <div className="max-w-lg mx-auto bg-white rounded-3xl border-2 border-[#6C5CE7]/30 shadow-xl overflow-hidden relative">
          {/* Top accent badge */}
          <div className="bg-[#6C5CE7] text-white text-center py-2 text-xs font-semibold uppercase tracking-wider">
            Free Plan • Browser Workspace
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Price Header */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-extrabold text-[#171717] tracking-tight">
                  $0
                </span>
                <span className="text-sm font-medium text-[#666666]">
                  / free forever
                </span>
              </div>
              <p className="mt-2 text-sm text-[#666666]">
                Full access to our browser-based code editor and AI assistant.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-3.5 pt-2 border-t border-[#EAEAEA]">
              <div className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                What&apos;s Included:
              </div>
              <ul className="space-y-3">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#171717]">
                    <div className="w-5 h-5 rounded-full bg-[#F3F0FF] text-[#6C5CE7] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <a
                href="#editor-demo"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-[#6C5CE7] hover:bg-[#5b4cc4] shadow-md hover:shadow-lg transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-center text-xs text-[#666666] mt-3">
                No credit card required • Instant access in your browser
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
