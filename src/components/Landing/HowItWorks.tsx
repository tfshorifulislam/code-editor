import React from "react";
import {
  Sparkles,
  PlayCircle,
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create your workspace",
      summary: "Start with a clean project workspace.",
      description:
        "Open a fresh project instantly in your browser. Organize directories, import templates, and start structuring your code without terminal configuration.",
      badge: "Zero Setup",
      mockup: (
        <div className="bg-neutral-900 rounded-xl p-3 border border-neutral-800 font-mono text-[11px] text-neutral-300 space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] pb-1 border-b border-neutral-800">
            <span>workspace-init</span>
            <span className="text-emerald-400">ready</span>
          </div>
          <div className="text-neutral-400">📁 src/</div>
          <div className="pl-3 text-sky-400">📄 App.tsx</div>
          <div className="pl-3 text-amber-400">📄 styles.css</div>
          <div className="text-neutral-400">📄 package.json</div>
        </div>
      ),
    },
    {
      number: "02",
      title: "Write code with AI",
      summary: "Use the assistant to explore ideas and improve code.",
      description:
        "Prompt the integrated AI assistant to write functions, scaffold components, or debug tricky issues. Inspect every proposed diff line-by-line before applying.",
      badge: "Smart Assistant",
      mockup: (
        <div className="bg-neutral-900 rounded-xl p-3 border border-neutral-800 font-mono text-[11px] text-neutral-300 space-y-1.5 shadow-inner">
          <div className="flex items-center gap-1.5 text-[#A78BFA] text-[10px] pb-1 border-b border-neutral-800">
            <Sparkles className="w-3 h-3" />
            <span>AI Code Generation</span>
          </div>
          <div className="text-neutral-400 italic">“Add responsive navigation”</div>
          <div className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded text-[10px]">
            + export function Navbar() &#123; ... &#125;
          </div>
          <div className="text-neutral-400 text-[10px]">✓ 12 lines generated</div>
        </div>
      ),
    },
    {
      number: "03",
      title: "Run, preview, and improve",
      summary: "Review the output and iterate.",
      description:
        "See your changes take shape immediately in the integrated browser preview. Inspect console logs in the terminal, fine-tune details, and export your code.",
      badge: "Instant Feedback",
      mockup: (
        <div className="bg-neutral-900 rounded-xl p-3 border border-neutral-800 font-mono text-[11px] text-neutral-300 space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] pb-1 border-b border-neutral-800">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Server :3000
            </span>
            <span className="text-neutral-400">Fast Reload</span>
          </div>
          <div className="bg-white text-neutral-900 p-2 rounded text-center font-sans">
            <div className="text-[10px] font-bold">Preview Ready</div>
            <div className="text-[9px] text-neutral-500">0 errors reported</div>
          </div>
          <div className="text-emerald-400 text-[10px]">✓ Compiled in 28ms</div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-32 bg-neutral-50/60 border-t border-[#EAEAEA] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#6C5CE7] border border-[#6C5CE7]/20 shadow-xs mb-4">
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Workflow Overview</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#171717]">
            From idea to working code.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#666666] leading-relaxed">
            A frictionless development cycle designed to keep you focused on
            building, not configuring.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-white rounded-2xl border border-[#EAEAEA] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Step number badge & header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-extrabold text-[#6C5CE7]/30 font-mono">
                    {step.number}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F0FF] text-[#6C5CE7]">
                    {step.badge}
                  </span>
                </div>

                {/* Title & summaries */}
                <h3 className="text-lg sm:text-xl font-bold text-[#171717] mb-1">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-[#6C5CE7] mb-3">
                  {step.summary}
                </p>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mb-6">
                  {step.description}
                </p>
              </div>

              {/* Step visual illustration */}
              <div className="mt-auto pt-2">{step.mockup}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
