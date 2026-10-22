import React from "react";
import {
  Sparkles,
  Clock,
  Bot,
  User,
  Check,
  FileCode,
} from "lucide-react";

export default function AIAgent() {
  const tasks = [
    {
      title: "Planning project structure",
      status: "completed",
      detail: "Identified component hierarchy and directory organization",
    },
    {
      title: "Creating components",
      status: "completed",
      detail: "Generated Hero.tsx and Pricing.tsx with modular exports",
    },
    {
      title: "Writing responsive styles",
      status: "completed",
      detail: "Configured mobile-first Tailwind utility classes and layout",
    },
    {
      title: "Checking the result",
      status: "in-progress",
      detail: "Validating markup, contrast, and TypeScript compiler types",
    },
  ];

  return (
    <section
      id="ai-agent"
      className="py-20 sm:py-32 bg-[#F3F0FF]/80 border-y border-[#6C5CE7]/20 relative overflow-hidden"
    >
      {/* Decorative subtle background elements */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-[#6C5CE7]/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 bg-[#6C5CE7]/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#6C5CE7] border border-[#6C5CE7]/30 shadow-xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Autonomous AI Assistant</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#171717]">
            Describe it. Build it. Improve it.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#666666] leading-relaxed">
            Turn natural language instructions into clean, modular code. The AI
            breaks down complex requests into transparent, verifiable steps.
          </p>
        </div>

        {/* Large AI Chat & Task Execution Mockup */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#EAEAEA] shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-neutral-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6C5CE7] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                  <span>AI Agent Session</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-xs text-neutral-400">
                  Model: Claude 3.5 Sonnet • Multi-file reasoning
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700">
                Workspace: active
              </span>
            </div>
          </div>

          {/* Chat Body */}
          <div className="p-5 sm:p-8 space-y-6">
            {/* User Message Bubble */}
            <div className="flex items-start gap-3.5 max-w-2xl ml-auto justify-end">
              <div className="bg-[#6C5CE7] text-white p-4 rounded-2xl rounded-tr-xs shadow-sm">
                <div className="text-[11px] font-semibold text-violet-200 uppercase tracking-wider mb-1">
                  Developer Prompt
                </div>
                <p className="text-sm sm:text-base font-medium leading-relaxed">
                  “Build a responsive landing page with a hero section and
                  pricing cards.”
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* AI Agent Execution Card */}
            <div className="bg-neutral-50 border border-[#EAEAEA] rounded-2xl p-5 sm:p-6 space-y-5">
              {/* Progress Bar & Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-[#171717] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#6C5CE7]" />
                    <span>Agent Plan Execution</span>
                  </span>
                  <span className="font-mono text-xs text-[#6C5CE7] font-semibold">
                    Step 3 of 4 completed (75%)
                  </span>
                </div>
                <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#6C5CE7] h-full w-3/4 rounded-full transition-all duration-500" />
                </div>
              </div>

              {/* Four Illustrated Tasks */}
              <div className="space-y-3 pt-1">
                {tasks.map((task, idx) => {
                  const isDone = task.status === "completed";
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                        isDone
                          ? "bg-white border-[#EAEAEA]"
                          : "bg-violet-50/70 border-[#6C5CE7]/30 ring-1 ring-[#6C5CE7]/20"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center animate-spin">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#171717]">
                            {task.title}
                          </h4>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                              isDone
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-violet-100 text-[#6C5CE7] border border-violet-200"
                            }`}
                          >
                            {isDone ? "Completed" : "In Progress"}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666] mt-0.5">
                          {task.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Code Change Preview snippet */}
              <div className="rounded-xl border border-neutral-300 bg-neutral-900 p-4 font-mono text-xs text-neutral-300 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-1.5 text-neutral-200">
                    <FileCode className="w-3.5 h-3.5 text-[#6C5CE7]" />
                    <span>src/components/Pricing.tsx</span>
                  </div>
                  <span className="text-emerald-400">Newly Generated File</span>
                </div>
                <pre className="text-xs text-neutral-300 overflow-x-auto">
                  <code>
                    <span className="text-purple-400">export default function</span>{" "}
                    <span className="text-sky-300">PricingSection</span>() &#123;{"\n"}
                    {"  "}&lt;<span className="text-sky-400">div</span>{" "}
                    <span className="text-amber-300">className</span>=
                    <span className="text-emerald-300">&quot;grid grid-cols-1 md:grid-cols-3 gap-6&quot;</span>&gt;{"\n"}
                    {"    "}&lt;<span className="text-sky-400">PricingCard</span>{" "}
                    <span className="text-amber-300">tier</span>=
                    <span className="text-emerald-300">&quot;Free&quot;</span>{" "}
                    <span className="text-amber-300">price</span>=
                    <span className="text-emerald-300">&quot;$0&quot;</span> /&gt;{"\n"}
                    {"  "}&lt;/<span className="text-sky-400">div</span>&gt;{"\n"}
                    &#125;
                  </code>
                </pre>
              </div>

              {/* Typing indicator */}
              <div className="flex items-center gap-2 text-xs text-[#6C5CE7] font-medium pt-1">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce" />
                </span>
                <span>AI Agent is checking markup and styles...</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-neutral-50 px-5 sm:px-6 py-3 border-t border-[#EAEAEA] text-center text-xs text-[#666666]">
            Visual demonstration — illustrates the multi-step reasoning and
            component generation workflow.
          </div>
        </div>
      </div>
    </section>
  );
}
