"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  AlertCircle,
  FileText,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
import { BottomTab, ConsoleMessage, Project } from "@/types/editor";

interface TerminalPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: BottomTab;
  onSelectTab: (tab: BottomTab) => void;
  consoleMessages: ConsoleMessage[];
  onClearConsole: () => void;
  project: Project;
}

export default function TerminalPanel({
  isOpen,
  onToggle,
  activeTab,
  onSelectTab,
  consoleMessages,
  onClearConsole,
  project,
}: TerminalPanelProps) {
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "Code Editor Interactive Shell v1.0.0",
    "Type 'help' for available commands, or 'npm run dev' to boot development preview.",
    "",
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, consoleMessages]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = currentInput.trim();
    if (!cmd) return;

    const newHistory = [...terminalHistory, `~/project $ ${cmd}`];

    const lower = cmd.toLowerCase();
    if (lower === "clear" || lower === "cls") {
      setTerminalHistory([]);
      setCurrentInput("");
      return;
    } else if (lower === "help") {
      newHistory.push(
        "Available commands:",
        "  help         Show available shell commands",
        "  ls           List files in current project",
        "  cat <file>   Display contents of a file",
        "  npm run dev  Trigger project preview build",
        "  npm test     Run project test runner",
        "  clear        Clear the terminal screen",
        "  date         Show current local date and time",
        "  whoami       Display active user profile"
      );
    } else if (lower === "ls") {
      const names = project.files.map((f) => (f.isFolder ? `📁 ${f.name}/` : `📄 ${f.name}`));
      newHistory.push(...names);
    } else if (lower.startsWith("cat ")) {
      const fileName = cmd.slice(4).trim();
      const file = project.files.find(
        (f) => f.name.toLowerCase() === fileName.toLowerCase() || f.path.toLowerCase() === fileName.toLowerCase()
      );
      if (file) {
        newHistory.push(file.content);
      } else {
        newHistory.push(`cat: ${fileName}: No such file`);
      }
    } else if (lower.startsWith("python")) {
      newHistory.push(
        "Python 3.12.2 (main, Linux x86_64)",
        "[GCC 13.2.0] on linux",
        `Executing ${cmd.replace("python", "").trim() || "script"}...`,
        "✓ Process finished with exit code 0"
      );
    } else if (lower.startsWith("go run")) {
      newHistory.push(
        "go: downloading dependencies...",
        "Starting Go HTTP service on :8080",
        "✓ Server listening on http://localhost:8080"
      );
    } else if (lower.startsWith("cargo run") || lower.startsWith("cargo build")) {
      newHistory.push(
        "   Compiling rust-workspace v0.1.0 (/workspace)",
        "    Finished dev [unoptimized + debuginfo] target(s) in 1.42s",
        "     Running `target/debug/rust-workspace`",
        "🦀 Rust Cloud Workspace Initialized!"
      );
    } else if (lower.startsWith("make") || lower.startsWith("g++")) {
      newHistory.push(
        "g++ -std=c++20 -Wall -O2 -o app main.cpp",
        "./app",
        "C++20 Cloud Workspace Initialized",
        "✓ Compilation completed successfully."
      );
    } else if (lower.startsWith("git status")) {
      newHistory.push(
        "On branch main",
        "Your branch is up to date with 'origin/main'.",
        "nothing to commit, working tree clean"
      );
    } else if (lower.startsWith("git branch")) {
      newHistory.push("* main");
    } else if (lower.startsWith("git log")) {
      newHistory.push(
        "commit 7f4a1c9e821 (HEAD -> main)",
        "Author: Developer <developer@codeeditor.io>",
        "Date:   Just now",
        "",
        "    feat: initialize cloud workspace template"
      );
    } else if (lower === "pwd") {
      newHistory.push(`/workspaces/${project.name.toLowerCase().replace(/\\s+/g, "-")}`);
    } else if (lower.startsWith("node")) {
      newHistory.push(
        "v22.2.0",
        `Server running on http://localhost:3001`
      );
    } else if (lower === "npm run dev") {
      newHistory.push(
        "▲ Next.js / Vite build simulator",
        "✓ Compiling modules...",
        `✓ Ready in 480ms on http://localhost:3000`,
        `✓ Project: ${project.name} (${project.template})`
      );
    } else if (lower === "date") {
      newHistory.push(new Date().toString());
    } else if (lower === "whoami") {
      newHistory.push("developer@code-editor-browser");
    } else {
      newHistory.push(`bash: ${cmd}: command executed. Type 'help' for instructions.`);
    }

    setTerminalHistory(newHistory);
    setCurrentInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="h-48 sm:h-56 bg-[#181818] border-t border-[#2b2b2b] flex flex-col font-mono text-xs select-none shrink-0 z-20">
      {/* Panel Tab Header */}
      <div className="h-8 bg-[#252526] border-b border-[#1e1e1e] px-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectTab("terminal")}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-t font-sans font-medium transition cursor-pointer ${
              activeTab === "terminal"
                ? "bg-[#181818] text-white border-t-2 border-t-[var(--color-primary)]"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("output")}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-t font-sans font-medium transition cursor-pointer ${
              activeTab === "output"
                ? "bg-[#181818] text-white border-t-2 border-t-[var(--color-primary)]"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Output / Console</span>
            {consoleMessages.length > 0 && (
              <span className="text-[10px] px-1 bg-neutral-700 rounded-full">
                {consoleMessages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("problems")}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-t font-sans font-medium transition cursor-pointer ${
              activeTab === "problems"
                ? "bg-[#181818] text-white border-t-2 border-t-[var(--color-primary)]"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Problems (0)</span>
          </button>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 text-neutral-400">
          {activeTab === "output" && (
            <button
              type="button"
              onClick={onClearConsole}
              title="Clear output console"
              className="p-1 hover:text-white rounded hover:bg-[#333333] transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {activeTab === "terminal" && (
            <button
              type="button"
              onClick={() => setTerminalHistory([])}
              title="Clear terminal"
              className="p-1 hover:text-white rounded hover:bg-[#333333] transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            title="Close panel"
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-3 text-neutral-300">
        {/* Terminal Tab Content */}
        {activeTab === "terminal" && (
          <div
            className="h-full flex flex-col cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="space-y-0.5 leading-relaxed">
              {terminalHistory.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.startsWith("✓")
                      ? "text-emerald-400"
                      : line.startsWith("bash:")
                      ? "text-rose-400"
                      : line.startsWith("~/")
                      ? "text-cyan-300"
                      : ""
                  }
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Prompt input row */}
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 mt-1">
              <span className="text-emerald-400 font-semibold shrink-0">~/project $</span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                className="bg-transparent text-white outline-none flex-1 font-mono text-xs border-none p-0"
                autoFocus
              />
            </form>
            <div ref={endRef} />
          </div>
        )}

        {/* Output / Console Tab Content */}
        {activeTab === "output" && (
          <div className="space-y-1">
            {consoleMessages.length === 0 ? (
              <div className="text-neutral-500 italic">
                No runtime logs yet. Run preview or perform actions that log to console.
              </div>
            ) : (
              consoleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 py-0.5 font-mono ${
                    msg.type === "error"
                      ? "text-rose-400 bg-rose-950/20 px-1 rounded"
                      : msg.type === "warn"
                      ? "text-amber-400"
                      : "text-neutral-300"
                  }`}
                >
                  <span className="text-neutral-600 select-none text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-semibold uppercase text-[10px] select-none text-neutral-500">
                    [{msg.type}]
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{msg.content}</span>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
        )}

        {/* Problems Tab Content */}
        {activeTab === "problems" && (
          <div className="flex items-center gap-2 text-neutral-400 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No syntax errors, build issues, or type diagnostics detected in workspace.</span>
          </div>
        )}
      </div>
    </div>
  );
}
