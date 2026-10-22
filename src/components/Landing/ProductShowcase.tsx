import React from "react";
import {
  FileCode,
  Layers,
  Sparkles,
  CheckCircle2,
  Check,
  Zap,
  RotateCw,
} from "lucide-react";

export default function ProductShowcase() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F3F0FF] text-[#6C5CE7] border border-[#6C5CE7]/20 mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Product Highlights</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#171717]">
            From first prompt to finished product.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#666666] leading-relaxed">
            A developer workspace designed for clarity and speed. Everything you
            need to write, review, and preview web projects in one browser tab.
          </p>
        </div>

        {/* Feature Stories Container */}
        <div className="space-y-24 sm:space-y-36">
          {/* Story A: Code without friction (Text Left, Visual Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Story A Text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 text-xs font-mono font-medium">
                <FileCode className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>WORKSPACE CORE</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#171717]">
                Code without friction
              </h3>
              <p className="text-base sm:text-lg text-[#666666] leading-relaxed">
                A focused, browser-based development workspace. Organize complex
                projects with a clean interface that gets out of your way.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Syntax highlighting across all your project files",
                  "Multiple files and tabs with instant switching",
                  "Full file explorer with nested folder hierarchies",
                  "Clean development environment without local setup fatigue",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#171717]">
                    <CheckCircle2 className="w-5 h-5 text-[#6C5CE7] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Story A Visual */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[#EAEAEA] bg-[#0E131F] p-4 sm:p-6 shadow-xl transition-all hover:shadow-2xl">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#222938] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs font-mono text-neutral-400">
                      src/components/Header.tsx
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                    <span className="px-2 py-0.5 rounded bg-[#1B2232] text-neutral-300">
                      TypeScript
                    </span>
                  </div>
                </div>

                {/* Split mini representation */}
                <div className="grid grid-cols-12 gap-3 font-mono text-xs">
                  {/* Mini File Tree */}
                  <div className="col-span-4 bg-[#141A26] p-3 rounded-lg border border-[#202838] space-y-2 select-none hidden sm:block">
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                      Files
                    </div>
                    <div className="text-neutral-400 space-y-1 text-[11px]">
                      <div className="text-neutral-200 font-medium">📁 components</div>
                      <div className="pl-3 text-emerald-400">📄 Header.tsx</div>
                      <div className="pl-3">📄 Button.tsx</div>
                      <div className="pl-3">📄 Card.tsx</div>
                      <div className="text-neutral-400">📁 hooks</div>
                      <div className="text-neutral-400">📄 package.json</div>
                    </div>
                  </div>

                  {/* Code Block */}
                  <div className="col-span-12 sm:col-span-8 bg-[#121622] p-4 rounded-lg border border-[#202838] overflow-x-auto text-neutral-300">
                    <pre className="text-xs font-mono leading-relaxed">
                      <code>
                        <span className="text-purple-400">export function</span>{" "}
                        <span className="text-sky-300">Header</span>(&#123; title &#125;) &#123;{"\n"}
                        {"  "}
                        <span className="text-purple-400">return</span> ({"\n"}
                        {"    "}&lt;<span className="text-sky-400">header</span>{" "}
                        <span className="text-amber-300">className</span>=
                        <span className="text-emerald-400">&quot;flex items-center&quot;</span>&gt;{"\n"}
                        {"      "}&lt;<span className="text-sky-400">h1</span>&gt;&#123;title&#125;&lt;/
                        <span className="text-sky-400">h1</span>&gt;{"\n"}
                        {"      "}&lt;<span className="text-sky-400">StatusIndicator</span> /&gt;{"\n"}
                        {"    "}&lt;/<span className="text-sky-400">header</span>&gt;{"\n"}
                        {"  "});{"\n"}
                        &#125;
                      </code>
                    </pre>
                    <div className="mt-4 pt-3 border-t border-[#202838] flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Clean AST Validated
                      </span>
                      <span>Ln 12, Col 4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story B: An AI that actually helps (Visual Left, Text Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Story B Visual (Alternating left position) */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5 sm:p-7 shadow-xl space-y-4">
                {/* AI Review Header */}
                <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#6C5CE7] flex items-center justify-center text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#171717]">
                        AI Code Modification Review
                      </h4>
                      <p className="text-xs text-[#666666]">
                        3 files proposed • 2 insertions, 1 deletion
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-[#F3F0FF] text-[#6C5CE7]">
                    Ready to Apply
                  </span>
                </div>

                {/* Diff Viewer Representation */}
                <div className="rounded-xl border border-[#EAEAEA] overflow-hidden font-mono text-xs">
                  <div className="bg-neutral-50 px-3 py-2 border-b border-[#EAEAEA] flex items-center justify-between text-neutral-600 text-[11px]">
                    <span className="font-semibold text-neutral-800">
                      src/lib/api.ts
                    </span>
                    <span className="text-neutral-500">Unified Diff</span>
                  </div>
                  <div className="p-3 bg-neutral-900 text-neutral-200 space-y-1">
                    <div className="text-neutral-500">@@ -14,4 +14,7 @@ async function fetchData()</div>
                    <div className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded">
                      - const response = await fetch(url);
                    </div>
                    <div className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                      + const response = await fetchWithRetry(url, &#123; retries: 3 &#125;);
                    </div>
                    <div className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                      + if (!response.ok) throw new APIError(response.statusText);
                    </div>
                  </div>
                </div>

                {/* AI Explanation & Actions */}
                <div className="bg-[#F3F0FF]/60 border border-[#6C5CE7]/20 rounded-xl p-3.5 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#171717] space-y-1">
                    <div className="font-semibold">AI Explanation:</div>
                    <p className="text-[#666666] leading-relaxed">
                      Replaced standard network call with automatic 3-step retry backoff and
                      explicit error handling to prevent unhandled promise rejections.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    className="flex-1 py-2 px-4 rounded-lg bg-[#6C5CE7] hover:bg-[#5b4cc4] text-white text-xs font-semibold shadow-sm transition"
                  >
                    Accept Changes
                  </button>
                  <button
                    type="button"
                    className="py-2 px-4 rounded-lg border border-[#EAEAEA] hover:bg-neutral-50 text-xs font-medium text-[#666666] transition"
                  >
                    View File Diff
                  </button>
                </div>
              </div>
            </div>

            {/* Story B Text (Right position) */}
            <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-violet-50 text-[#6C5CE7] text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INTELLIGENT CO-PILOT</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#171717]">
                An AI that actually helps
              </h3>
              <p className="text-base sm:text-lg text-[#666666] leading-relaxed">
                An AI assistant designed to help developers understand and improve
                their code without replacing human control.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Ask questions about code and architectural patterns",
                  "Generate and edit multiple files across your workspace",
                  "Explain tricky runtime errors and suggest verified solutions",
                  "Review proposed changes line-by-line before applying them",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#171717]">
                    <CheckCircle2 className="w-5 h-5 text-[#6C5CE7] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Story C: See your ideas come alive (Text Left, Visual Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Story C Text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-mono font-medium">
                <Zap className="w-3.5 h-3.5" />
                <span>LIVE FEEDBACK LOOP</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#171717]">
                See your ideas come alive
              </h3>
              <p className="text-base sm:text-lg text-[#666666] leading-relaxed">
                Keep development and visual feedback together in one workspace.
                No context-switching across external browser tabs.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Live preview for supported web projects with instant hot-reload",
                  "Integrated terminal and standard console output",
                  "Complete build and test workflow directly inside the browser",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#171717]">
                    <CheckCircle2 className="w-5 h-5 text-[#6C5CE7] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Story C Visual */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[#EAEAEA] bg-neutral-900 p-4 sm:p-6 shadow-xl space-y-3 text-white">
                {/* Browser address bar */}
                <div className="flex items-center justify-between bg-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-400">http://localhost:3000/dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-[11px]">Hot Reload Active</span>
                  </div>
                </div>

                {/* Rendered Live Website Mockup Box */}
                <div className="bg-white text-neutral-900 rounded-lg p-5 border border-neutral-200 shadow-inner">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                    <span className="font-bold text-sm text-neutral-900">
                      Analytics Dashboard
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-neutral-100 rounded text-neutral-600">
                      Live Preview
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 rounded-md bg-neutral-50 border border-neutral-100">
                      <div className="text-[10px] text-neutral-500 uppercase">Requests</div>
                      <div className="text-sm font-bold text-neutral-900">42.8k</div>
                    </div>
                    <div className="p-2.5 rounded-md bg-neutral-50 border border-neutral-100">
                      <div className="text-[10px] text-neutral-500 uppercase">Latency</div>
                      <div className="text-sm font-bold text-emerald-600">18ms</div>
                    </div>
                    <div className="p-2.5 rounded-md bg-violet-50 border border-violet-100">
                      <div className="text-[10px] text-violet-600 uppercase">Build</div>
                      <div className="text-sm font-bold text-violet-700">Turbo ✓</div>
                    </div>
                  </div>
                </div>

                {/* Terminal Log Output underneath */}
                <div className="bg-black/50 p-3 rounded-lg border border-neutral-800 font-mono text-[11px] text-neutral-400 space-y-1">
                  <div className="text-neutral-500"># Turbopack build log</div>
                  <div className="text-emerald-400">✓ Page reloaded: 1 component updated in 24ms</div>
                  <div className="text-neutral-300">○ Ready for user interaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
