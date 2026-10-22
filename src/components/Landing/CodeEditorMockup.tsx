"use client";

import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Play,
  Sparkles,
  Terminal as TerminalIcon,
  Globe,
  Check,
  ChevronRight,
  ChevronDown,
  RotateCw,
  GitBranch,
  Search,
  CheckCircle2,
  Send,
} from "lucide-react";

type FileKey = "Hero.tsx" | "page.tsx" | "globals.css" | "package.json" | "tsconfig.json";

interface FileContent {
  path: string;
  language: string;
  code: string;
}

const fileDatabase: Record<FileKey, FileContent> = {
  "Hero.tsx": {
    path: "src/components/Hero.tsx",
    language: "typescript",
    code: `import React, { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  const [copied, setCopied] = useState(false);

  return (
    <section className="relative px-6 py-16 text-center">
      {/* AI-generated announcement pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI Workspace Active</span>
      </div>

      <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900">
        Your ideas deserve better code.
      </h1>

      <p className="mt-4 text-base sm:text-lg text-neutral-600 max-w-xl mx-auto">
        Write, build, and ship projects with an intelligent AI coding assistant.
      </p>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium shadow-sm transition">
          Start Coding Free
        </button>
      </div>
    </section>
  );
}`,
  },
  "page.tsx": {
    path: "src/app/page.tsx",
    language: "typescript",
    code: `import React from "react";
import HeroSection from "@/components/Hero";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
    </main>
  );
}`,
  },
  "globals.css": {
    path: "src/styles/globals.css",
    language: "css",
    code: `@import "tailwindcss";

:root {
  --color-background: #ffffff;
  --color-foreground: #171717;
  --color-accent: #6C5CE7;
  --color-accent-soft: #F3F0FF;
}

body {
  color: var(--color-foreground);
  background: var(--color-background);
  font-family: var(--font-body);
}`,
  },
  "package.json": {
    path: "package.json",
    language: "json",
    code: `{
  "name": "my-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "16.4.2",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "lucide-react": "^1.61.0"
  }
}`,
  },
  "tsconfig.json": {
    path: "tsconfig.json",
    language: "json",
    code: `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "jsx": "preserve"
  }
}`,
  },
};

export default function CodeEditorMockup() {
  const [activeFile, setActiveFile] = useState<FileKey>("Hero.tsx");
  const [openFiles, setOpenFiles] = useState<FileKey[]>([
    "Hero.tsx",
    "page.tsx",
    "globals.css",
  ]);
  const [activeBottomTab, setActiveBottomTab] = useState<
    "terminal" | "preview" | "problems"
  >("terminal");
  const [mobileViewTab, setMobileViewTab] = useState<
    "editor" | "ai" | "preview" | "terminal"
  >("editor");
  const [appliedDiff, setAppliedDiff] = useState(false);
  const [srcFolderOpen, setSrcFolderOpen] = useState(true);
  const [compFolderOpen, setCompFolderOpen] = useState(true);
  const [appFolderOpen, setAppFolderOpen] = useState(true);

  const selectFile = (file: FileKey) => {
    if (!openFiles.includes(file)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFile(file);
    if (mobileViewTab !== "editor") {
      setMobileViewTab("editor");
    }
  };

  const closeTab = (file: FileKey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openFiles.length === 1) return;
    const nextTabs = openFiles.filter((f) => f !== file);
    setOpenFiles(nextTabs);
    if (activeFile === file) {
      setActiveFile(nextTabs[nextTabs.length - 1]);
    }
  };

  return (
    <section id="editor-demo" className="pt-2 pb-6 sm:pb-10 bg-[var(--color-surface)] relative">
      <div className="landing-container px-3 sm:px-6 relative">
        {/* Subtle restrained purple glow behind the mockup */}
        <div
          className="pointer-events-none absolute -inset-x-4 sm:-inset-x-8 -top-6 -bottom-6 -z-10 bg-gradient-to-b from-[var(--color-primary)]/15 via-[var(--color-primary)]/5 to-transparent blur-2xl opacity-60 rounded-3xl"
          aria-hidden="true"
        />

        {/* Editor Outer Container with Mac Chrome and refined elevation */}
        <div className="relative rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-code-background)] shadow-2xl overflow-hidden transition-all text-[var(--color-code-foreground)] font-sans ring-1 ring-black/10">
          {/* Top Chrome / Window Header */}
          <div className="h-11 bg-[#161B26] border-b border-[#222938] px-3 sm:px-4 flex items-center justify-between select-none">
            {/* macOS traffic light window controls */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 inline-block" />
              <div className="hidden sm:flex items-center gap-1.5 ml-3 text-xs text-neutral-400 font-medium">
                <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
                <span>main*</span>
              </div>
            </div>

            {/* Center Project / Command Palette Bar */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 bg-[var(--color-code-background)] hover:bg-[#1C2230] border border-[#262D3D] px-3 py-1 rounded-[var(--radius-md)] text-xs text-neutral-300 transition-colors cursor-pointer">
                <Search className="w-3 h-3 text-neutral-400" />
                <span className="hidden sm:inline font-mono">my-project</span>
                <span className="text-neutral-500 font-mono">/</span>
                <span className="text-neutral-300 font-medium font-mono">
                  {fileDatabase[activeFile].path}
                </span>
                <kbd className="hidden md:inline-block ml-2 px-1.5 py-0.5 text-[10px] bg-[#161B26] border border-[#2E364A] rounded text-neutral-400">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right Window Toolbar Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] text-xs bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                <span>Ready</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveBottomTab("preview")}
                title="Run in Live Preview"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-[var(--radius-sm)] transition shadow-sm active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Run</span>
              </button>
            </div>
          </div>

          {/* Mobile View Switcher - Ensures smooth navigation on small screens */}
          <div className="flex md:hidden bg-[#131823] border-b border-[#222938] p-1 gap-1">
            <button
              type="button"
              onClick={() => setMobileViewTab("editor")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] text-center transition ${
                mobileViewTab === "editor"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Code Editor
            </button>
            <button
              type="button"
              onClick={() => setMobileViewTab("ai")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] text-center transition flex items-center justify-center gap-1 ${
                mobileViewTab === "ai"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>AI Agent</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewTab("preview")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] text-center transition flex items-center justify-center gap-1 ${
                mobileViewTab === "preview"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Globe className="w-3 h-3 text-sky-400" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewTab("terminal")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] text-center transition flex items-center justify-center gap-1 ${
                mobileViewTab === "terminal"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <TerminalIcon className="w-3 h-3" />
              <span>Term</span>
            </button>
          </div>

          {/* Main 3-Panel Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[540px] lg:min-h-[600px]">
            {/* Panel 1: File Explorer (Left sidebar, visible on desktop / tablet) */}
            <div
              className={`md:col-span-3 lg:col-span-2 bg-[#121622] border-r border-[#202737] flex flex-col ${
                mobileViewTab !== "editor" ? "hidden md:flex" : "hidden sm:flex"
              }`}
            >
              <div className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-[#202737] flex items-center justify-between">
                <span>Explorer</span>
                <span className="text-[10px] text-neutral-400 bg-[#1D2433] px-1.5 py-0.5 rounded-[var(--radius-sm)]">
                  Workspace
                </span>
              </div>

              {/* Tree structure */}
              <div className="p-2 space-y-0.5 text-xs text-neutral-300 font-mono select-none overflow-y-auto">
                <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-400 font-semibold text-[11px]">
                  <span>MY-PROJECT</span>
                </div>

                {/* src folder */}
                <div>
                  <button
                    type="button"
                    onClick={() => setSrcFolderOpen(!srcFolderOpen)}
                    className="w-full flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[#1D2433] text-neutral-300 text-left transition"
                  >
                    {srcFolderOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    {srcFolderOpen ? (
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="font-medium">src</span>
                  </button>

                  {srcFolderOpen && (
                    <div className="pl-4 space-y-0.5 mt-0.5">
                      {/* components subfolder */}
                      <button
                        type="button"
                        onClick={() => setCompFolderOpen(!compFolderOpen)}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[#1D2433] text-neutral-300 text-left transition"
                      >
                        {compFolderOpen ? (
                          <ChevronDown className="w-3 h-3 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-neutral-400" />
                        )}
                        <Folder className="w-3.5 h-3.5 text-amber-400" />
                        <span>components</span>
                      </button>

                      {compFolderOpen && (
                        <div className="pl-5 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => selectFile("Hero.tsx")}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)] text-left transition ${
                              activeFile === "Hero.tsx"
                                ? "bg-[var(--color-primary)]/20 text-white font-medium border-l-2 border-[var(--color-primary)]"
                                : "text-neutral-400 hover:text-neutral-200 hover:bg-[#1A2130]"
                            }`}
                          >
                            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Hero.tsx</span>
                          </button>
                        </div>
                      )}

                      {/* app subfolder */}
                      <button
                        type="button"
                        onClick={() => setAppFolderOpen(!appFolderOpen)}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[#1D2433] text-neutral-300 text-left transition"
                      >
                        {appFolderOpen ? (
                          <ChevronDown className="w-3 h-3 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-neutral-400" />
                        )}
                        <Folder className="w-3.5 h-3.5 text-amber-400" />
                        <span>app</span>
                      </button>

                      {appFolderOpen && (
                        <div className="pl-5 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => selectFile("page.tsx")}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)] text-left transition ${
                              activeFile === "page.tsx"
                                ? "bg-[var(--color-primary)]/20 text-white font-medium border-l-2 border-[var(--color-primary)]"
                                : "text-neutral-400 hover:text-neutral-200 hover:bg-[#1A2130]"
                            }`}
                          >
                            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>page.tsx</span>
                          </button>
                        </div>
                      )}

                      {/* styles folder / globals.css */}
                      <button
                        type="button"
                        onClick={() => selectFile("globals.css")}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)] text-left transition ${
                          activeFile === "globals.css"
                            ? "bg-[var(--color-primary)]/20 text-white font-medium border-l-2 border-[var(--color-primary)]"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-[#1A2130]"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>globals.css</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Root project files */}
                <div className="pt-2 border-t border-[#202737] space-y-0.5">
                  <button
                    type="button"
                    onClick={() => selectFile("package.json")}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)] text-left transition ${
                      activeFile === "package.json"
                        ? "bg-[var(--color-primary)]/20 text-white font-medium border-l-2 border-[var(--color-primary)]"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-[#1A2130]"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-300" />
                    <span>package.json</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectFile("tsconfig.json")}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)] text-left transition ${
                      activeFile === "tsconfig.json"
                        ? "bg-[var(--color-primary)]/20 text-white font-medium border-l-2 border-[var(--color-primary)]"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-[#1A2130]"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-300" />
                    <span>tsconfig.json</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Panel 2: Central Code Editor (Editor tabs + Line numbers + Syntax code) */}
            <div
              className={`md:col-span-5 lg:col-span-6 bg-[var(--color-code-background)] flex flex-col justify-between overflow-hidden ${
                mobileViewTab !== "editor" ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Tab Bar */}
              <div className="bg-[#141A26] border-b border-[#222938] flex items-center overflow-x-auto select-none no-scrollbar">
                {openFiles.map((f) => (
                  <div
                    key={f}
                    onClick={() => setActiveFile(f)}
                    className={`group flex items-center gap-2 px-3.5 py-2 text-xs font-mono border-r border-[#222938] cursor-pointer transition ${
                      activeFile === f
                        ? "bg-[var(--color-code-background)] text-white border-t-2 border-t-[var(--color-primary)]"
                        : "text-neutral-400 hover:bg-[#1B2232] hover:text-neutral-200"
                    }`}
                  >
                    <FileCode
                      className={`w-3.5 h-3.5 ${
                        f.endsWith(".tsx")
                          ? "text-cyan-400"
                          : f.endsWith(".css")
                          ? "text-blue-400"
                          : "text-amber-400"
                      }`}
                    />
                    <span>{f}</span>
                    <button
                      type="button"
                      onClick={(e) => closeTab(f, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 ml-1 text-neutral-400 transition"
                      aria-label={`Close ${f}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Breadcrumb strip */}
              <div className="px-4 py-1.5 bg-[var(--color-code-background)] text-[11px] font-mono text-neutral-400 border-b border-[#1A2230] flex items-center gap-1.5">
                <span>my-project</span>
                <span>›</span>
                <span className="text-neutral-400">src</span>
                <span>›</span>
                <span className="text-neutral-300">{fileDatabase[activeFile].path}</span>
              </div>

              {/* Code Viewing Area with Named Syntax Tokens */}
              <div className="flex-1 overflow-x-auto p-4 font-mono text-xs leading-relaxed flex">
                {/* Line numbers */}
                <div
                  className="pr-4 mr-2 text-right text-[var(--color-syntax-line-number)] select-none border-r border-[#1F2738] flex flex-col"
                  aria-hidden="true"
                >
                  {fileDatabase[activeFile].code
                    .split("\n")
                    .map((_, i) => (
                      <span key={i} className="leading-relaxed">
                        {i + 1}
                      </span>
                    ))}
                </div>

                {/* Syntax highlighted code */}
                <pre className="text-[var(--color-code-foreground)] font-mono overflow-x-auto whitespace-pre">
                  <code>
                    {activeFile === "Hero.tsx" ? (
                      <>
                        <span className="text-[var(--color-syntax-keyword)]">import</span>{" "}
                        <span className="text-neutral-300">React, &#123; useState &#125;</span>{" "}
                        <span className="text-[var(--color-syntax-keyword)]">from</span>{" "}
                        <span className="text-[var(--color-syntax-string)]">&quot;react&quot;</span>;{"\n"}
                        <span className="text-[var(--color-syntax-keyword)]">import</span>{" "}
                        <span className="text-neutral-300">&#123; ArrowRight, Sparkles &#125;</span>{" "}
                        <span className="text-[var(--color-syntax-keyword)]">from</span>{" "}
                        <span className="text-[var(--color-syntax-string)]">&quot;lucide-react&quot;</span>;{"\n\n"}
                        <span className="text-[var(--color-syntax-function)]">export default function</span>{" "}
                        <span className="text-[var(--color-syntax-component)] font-semibold">HeroSection</span>() &#123;{"\n"}
                        {"  "}
                        <span className="text-[var(--color-syntax-function)]">const</span> [copied, setCopied] ={" "}
                        <span className="text-[var(--color-syntax-component)]">useState</span>(
                        <span className="text-[var(--color-syntax-number)]">false</span>);{"\n\n"}
                        {"  "}
                        <span className="text-[var(--color-syntax-function)]">return</span> ({"\n"}
                        {"    "}&lt;
                        <span className="text-[var(--color-syntax-component)]">section</span>{" "}
                        <span className="text-[var(--color-syntax-prop)]">className</span>=
                        <span className="text-[var(--color-syntax-string)]">&quot;relative px-6 py-16 text-center&quot;</span>&gt;{"\n"}
                        <span className="text-[var(--color-syntax-comment)]">
                          {"      "}&#123;/* AI-generated announcement pill */&#125;
                        </span>
                        {"\n"}
                        <span className={appliedDiff ? "bg-emerald-950/60 text-emerald-300 block -mx-2 px-2 py-0.5 rounded-[var(--radius-sm)] border-l-2 border-[var(--color-success)]" : ""}>
                          {"      "}&lt;
                          <span className="text-[var(--color-syntax-component)]">div</span>{" "}
                          <span className="text-[var(--color-syntax-prop)]">className</span>=
                          <span className="text-[var(--color-syntax-string)]">
                            &quot;inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200&quot;
                          </span>
                          &gt;{"\n"}
                          {"        "}&lt;
                          <span className="text-[var(--color-syntax-component)]">Sparkles</span>{" "}
                          <span className="text-[var(--color-syntax-prop)]">className</span>=
                          <span className="text-[var(--color-syntax-string)]">&quot;w-3.5 h-3.5&quot;</span> /&gt;{"\n"}
                          {"        "}&lt;<span className="text-[var(--color-syntax-component)]">span</span>&gt;AI Workspace Active&lt;/
                          <span className="text-[var(--color-syntax-component)]">span</span>&gt;{"\n"}
                          {"      "}&lt;/<span className="text-[var(--color-syntax-component)]">div</span>&gt;
                        </span>
                        {"\n\n"}
                        {"      "}&lt;
                        <span className="text-[var(--color-syntax-component)]">h1</span>{" "}
                        <span className="text-[var(--color-syntax-prop)]">className</span>=
                        <span className="text-[var(--color-syntax-string)]">&quot;mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900&quot;</span>&gt;{"\n"}
                        {"        "}Your ideas deserve better code.{"\n"}
                        {"      "}&lt;/<span className="text-[var(--color-syntax-component)]">h1</span>&gt;{"\n\n"}
                        {"      "}&lt;
                        <span className="text-[var(--color-syntax-component)]">p</span>{" "}
                        <span className="text-[var(--color-syntax-prop)]">className</span>=
                        <span className="text-[var(--color-syntax-string)]">&quot;mt-4 text-base sm:text-lg text-neutral-600 max-w-xl mx-auto&quot;</span>&gt;{"\n"}
                        {"        "}Write, build, and ship projects with an intelligent AI coding assistant.{"\n"}
                        {"      "}&lt;/<span className="text-[var(--color-syntax-component)]">p</span>&gt;{"\n\n"}
                        <span className={appliedDiff ? "bg-emerald-950/60 text-emerald-300 block -mx-2 px-2 py-0.5 rounded-[var(--radius-sm)] border-l-2 border-[var(--color-success)]" : ""}>
                          {"      "}&lt;
                          <span className="text-[var(--color-syntax-component)]">div</span>{" "}
                          <span className="text-[var(--color-syntax-prop)]">className</span>=
                          <span className="text-[var(--color-syntax-string)]">&quot;mt-8 flex items-center justify-center gap-3&quot;</span>&gt;{"\n"}
                          {"        "}&lt;
                          <span className="text-[var(--color-syntax-component)]">button</span>{" "}
                          <span className="text-[var(--color-syntax-prop)]">className</span>=
                          <span className="text-[var(--color-syntax-string)]">&quot;px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium shadow-sm transition&quot;</span>&gt;{"\n"}
                          {"          "}Start Coding Free{"\n"}
                          {"        "}&lt;/<span className="text-[var(--color-syntax-component)]">button</span>&gt;{"\n"}
                          {"      "}&lt;/<span className="text-[var(--color-syntax-component)]">div</span>&gt;
                        </span>
                        {"\n"}
                        {"    "}&lt;/<span className="text-[var(--color-syntax-component)]">section</span>&gt;{"\n"}
                        {"  "});{"\n"}
                        &#125;
                      </>
                    ) : (
                      fileDatabase[activeFile].code
                    )}
                  </code>
                </pre>
              </div>

              {/* Integrated Bottom Drawer: Terminal & Live Preview Tab */}
              <div className="border-t border-[#202737] bg-[#101420]">
                {/* Bottom tabs bar */}
                <div className="flex items-center justify-between px-3 bg-[#141A26] border-b border-[#202737] text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveBottomTab("terminal")}
                      className={`flex items-center gap-1.5 py-1.5 px-2.5 border-b-2 font-mono transition ${
                        activeBottomTab === "terminal"
                          ? "border-[var(--color-primary)] text-white font-medium"
                          : "border-transparent text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <TerminalIcon className="w-3 h-3" />
                      <span>Terminal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBottomTab("preview")}
                      className={`flex items-center gap-1.5 py-1.5 px-2.5 border-b-2 font-mono transition ${
                        activeBottomTab === "preview"
                          ? "border-[var(--color-primary)] text-white font-medium"
                          : "border-transparent text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Globe className="w-3 h-3 text-sky-400" />
                      <span>Live Preview</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBottomTab("problems")}
                      className={`flex items-center gap-1.5 py-1.5 px-2.5 border-b-2 font-mono transition ${
                        activeBottomTab === "problems"
                          ? "border-[var(--color-primary)] text-white font-medium"
                          : "border-transparent text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <span>Problems (0)</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono hidden sm:block">
                    node v20.18 • turbopack
                  </div>
                </div>

                {/* Bottom panel content */}
                <div className="p-3 font-mono text-xs min-h-[96px] max-h-[140px] overflow-y-auto">
                  {activeBottomTab === "terminal" && (
                    <div className="space-y-1 text-neutral-300">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <span className="text-[var(--color-success)] font-semibold">~/my-project</span>
                        <span>$</span>
                        <span className="text-white">npm run dev</span>
                      </div>
                      <div className="text-neutral-400">▲ Next.js 16.4.2 (Turbopack)</div>
                      <div className="text-[var(--color-success)]">✓ Ready in 640ms</div>
                      <div className="text-neutral-300">
                        ○ Local:{" "}
                        <span className="text-sky-400 underline cursor-pointer">
                          http://localhost:3000
                        </span>
                      </div>
                      <div className="text-neutral-400">
                        ✓ Compiled /src/components/Hero.tsx in 42ms (48 modules)
                      </div>
                    </div>
                  )}

                  {activeBottomTab === "preview" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-[#192030] px-3 py-1 rounded-[var(--radius-sm)] border border-[#273248] text-xs">
                        <div className="flex items-center gap-2 text-neutral-300">
                          <RotateCw className="w-3 h-3 text-neutral-400 hover:text-white cursor-pointer" />
                          <span className="text-neutral-400">http://localhost:3000</span>
                        </div>
                        <span className="text-[10px] bg-[var(--color-success)]/20 text-[var(--color-success)] px-1.5 py-0.5 rounded-[var(--radius-sm)]">
                          Live 3000
                        </span>
                      </div>
                      {/* Mini rendered website preview */}
                      <div className="p-4 bg-[var(--color-surface)] text-[var(--color-foreground)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-inner text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-semibold bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Workspace Active</span>
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-[var(--color-foreground)]">
                          Your ideas deserve better code.
                        </h4>
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 text-[11px] font-medium bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] shadow-xs">
                            Start Coding Free
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeBottomTab === "problems" && (
                    <div className="text-neutral-400 text-xs py-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
                      <span>No syntax or type errors found in workspace.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel 3: AI Agent Chat Panel (Right sidebar) */}
            <div
              className={`md:col-span-4 lg:col-span-4 bg-[#131826] border-l border-[#202737] flex flex-col justify-between ${
                mobileViewTab !== "ai" ? "hidden md:flex" : "flex"
              }`}
            >
              {/* AI Header */}
              <div className="px-3.5 py-2.5 bg-[#171E2E] border-b border-[#222B3D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>AI Coding Assistant</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                    </div>
                    <div className="text-[10px] text-neutral-400">Context: Hero.tsx</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[#222B3D] text-neutral-300 px-2 py-0.5 rounded-[var(--radius-sm)] font-mono">
                  Claude 3.5 Sonnet
                </span>
              </div>

              {/* Chat Thread */}
              <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto text-xs">
                {/* User Prompt */}
                <div className="flex flex-col items-end">
                  <div className="max-w-[90%] bg-[var(--color-primary)] text-white p-2.5 rounded-2xl rounded-tr-xs shadow-sm">
                    <p className="leading-relaxed">
                      Add an animated gradient badge and responsive CTA to this Hero
                      component.
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 mr-1">You • just now</span>
                </div>

                {/* AI Response Card */}
                <div className="flex flex-col items-start space-y-2">
                  <div className="w-full bg-[#1A2234] border border-[#27344D] rounded-[var(--radius-lg)] p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-neutral-200 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <span>Proposed Changes</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-success)] bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded-[var(--radius-sm)] font-mono">
                        +8 lines / -2 lines
                      </span>
                    </div>

                    <p className="text-neutral-300 text-[11px] leading-relaxed">
                      I&apos;ve added the announcement pill with a sparkle icon and updated the
                      primary button styling.
                    </p>

                    {/* Diff Preview Box */}
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-code-background)] border border-[#232D40] p-2 font-mono text-[11px] overflow-x-auto space-y-0.5">
                      <div className="text-neutral-400 text-[10px] pb-1 border-b border-[#1E2638]">
                        src/components/Hero.tsx
                      </div>
                      <div className="text-[var(--color-success)] bg-emerald-950/40 px-1 py-0.5 rounded-[var(--radius-sm)]">
                        + &lt;div className=&quot;inline-flex items-center gap-2 ...&quot;&gt;
                      </div>
                      <div className="text-[var(--color-success)] bg-emerald-950/40 px-1 py-0.5 rounded-[var(--radius-sm)]">
                        + &lt;Sparkles className=&quot;w-3.5 h-3.5&quot; /&gt;
                      </div>
                      <div className="text-[var(--color-success)] bg-emerald-950/40 px-1 py-0.5 rounded-[var(--radius-sm)]">
                        + &lt;button className=&quot;px-5 py-2.5 bg-violet-600 ...&quot;&gt;
                      </div>
                    </div>

                    {/* Diff Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAppliedDiff(!appliedDiff)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition ${
                          appliedDiff
                            ? "bg-[var(--color-success)] text-white"
                            : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{appliedDiff ? "Diff Applied ✓" : "Apply Diff"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAppliedDiff(false)}
                        className="px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium bg-[#222C3E] hover:bg-[#2A364B] text-neutral-300 transition"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick actions chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveBottomTab("preview")}
                    className="text-[10px] bg-[#1C2538] hover:bg-[#26324A] text-neutral-300 px-2 py-1 rounded-[var(--radius-sm)] border border-[#2B374E] transition"
                  >
                    View in browser →
                  </button>
                  <button
                    type="button"
                    className="text-[10px] bg-[#1C2538] hover:bg-[#26324A] text-neutral-300 px-2 py-1 rounded-[var(--radius-sm)] border border-[#2B374E] transition"
                  >
                    Explain changes
                  </button>
                  <button
                    type="button"
                    className="text-[10px] bg-[#1C2538] hover:bg-[#26324A] text-neutral-300 px-2 py-1 rounded-[var(--radius-sm)] border border-[#2B374E] transition"
                  >
                    Add tests
                  </button>
                </div>
              </div>

              {/* Chat Input Box */}
              <div className="p-3 bg-[#171E2E] border-t border-[#222B3D]">
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value="Ask AI to refactor, fix bugs, or add features..."
                    className="w-full bg-[var(--color-code-background)] border border-[#283348] rounded-[var(--radius-md)] pl-3 pr-9 py-2 text-xs text-neutral-400 cursor-not-allowed focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Send message"
                    className="absolute right-1.5 top-1.5 p-1 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-primary-hover)] transition"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-1.5 text-[10px] text-neutral-400 text-center">
                  Press ⏎ to submit • Interactive demo mockup
                </div>
              </div>
            </div>

            {/* Mobile View: Dedicated Preview Tab */}
            {mobileViewTab === "preview" && (
              <div className="md:hidden col-span-1 p-4 bg-[var(--color-surface)] text-[var(--color-foreground)]">
                <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-pill)] text-xs font-semibold bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Workspace Active</span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-foreground)]">
                    Your ideas deserve better code.
                  </h3>
                  <p className="text-sm landing-muted">
                    Write, build, and ship projects with an intelligent AI coding assistant.
                  </p>
                  <button className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-[var(--radius-md)]">
                    Start Coding Free
                  </button>
                </div>
              </div>
            )}

            {/* Mobile View: Dedicated Terminal Tab */}
            {mobileViewTab === "terminal" && (
              <div className="md:hidden col-span-1 p-4 bg-[var(--color-code-background)] text-xs font-mono text-neutral-300 space-y-1">
                <div className="text-[var(--color-success)]">~/my-project $ npm run dev</div>
                <div className="text-neutral-400">▲ Next.js 16.4.2 (Turbopack)</div>
                <div className="text-[var(--color-success)]">✓ Ready in 640ms</div>
                <div className="text-neutral-300">○ Local: http://localhost:3000</div>
              </div>
            )}
          </div>

          {/* Status Bar (IDE Bottom Strip) */}
          <div className="h-7 bg-[#161B26] border-t border-[#222938] px-3 flex items-center justify-between text-[11px] text-neutral-400 select-none font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-neutral-300">
                <GitBranch className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>main</span>
              </span>
              <span className="hidden sm:inline text-neutral-400">•</span>
              <span className="hidden sm:inline">0 Errors</span>
              <span className="hidden sm:inline">0 Warnings</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Ln 14, Col 28</span>
              <span className="hidden sm:inline">Spaces: 2</span>
              <span>UTF-8</span>
              <span className="text-sky-400 font-semibold">TypeScript React</span>
              <span className="text-[var(--color-success)] hidden sm:inline">Prettier: ✓</span>
            </div>
          </div>
        </div>

        {/* Small honest caption */}
        <p className="text-center text-xs landing-muted mt-3 font-normal">
          Interactive UI preview — demonstrates the browser-based multi-panel workspace.
        </p>
      </div>
    </section>
  );
}
