"use client";

import React, { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import {
  Terminal as TerminalIcon,
  AlertCircle,
  FileText,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { BottomTab, ConsoleMessage, Project, ProjectFile } from "@/types/editor";

interface TerminalPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: BottomTab;
  onSelectTab: (tab: BottomTab) => void;
  consoleMessages: ConsoleMessage[];
  onClearConsole: () => void;
  project: Project;
  onFilesSynced?: (files: ProjectFile[]) => void;
}

interface TerminalLine {
  id: string;
  text: string;
  type: "command" | "stdout" | "stderr" | "system" | "success";
}

let lineCounter = 0;
function getLineId(): string {
  lineCounter += 1;
  return `t-line-${lineCounter}`;
}

export default function TerminalPanel({
  isOpen,
  onToggle,
  activeTab,
  onSelectTab,
  consoleMessages,
  onClearConsole,
  project,
  onFilesSynced,
}: TerminalPanelProps) {
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: getLineId(),
      text: "Code Editor Interactive Workspace Terminal",
      type: "system",
    },
    {
      id: getLineId(),
      text: `Connected to workspace: ${project.name} (${project.template || "custom"})`,
      type: "system",
    },
    {
      id: getLineId(),
      text: "Type 'help' for available commands, or run commands like 'ls', 'node -v', 'touch <file>'.",
      type: "system",
    },
  ]);

  const [currentInput, setCurrentInput] = useState("");
  const [currentCwd, setCurrentCwd] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines, consoleMessages]);

  const promptPrefix = currentCwd ? `~/project/${currentCwd} $` : "~/project $";

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIndex);
      setCurrentInput(commandHistory[commandHistory.length - 1 - nextIndex] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - nextIndex] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
    }
  };

  const handleCommandSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cmd = currentInput.trim();
    if (!cmd || isExecuting) return;

    // Add command to prompt history
    const commandLine: TerminalLine = {
      id: getLineId(),
      text: `${promptPrefix} ${cmd}`,
      type: "command",
    };

    setTerminalLines((prev) => [...prev, commandLine]);
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setCurrentInput("");

    const lower = cmd.toLowerCase();

    // Client-side quick commands
    if (lower === "clear" || lower === "cls") {
      setTerminalLines([]);
      return;
    }

    if (lower === "help") {
      setTerminalLines((prev) => [
        ...prev,
        { id: getLineId(), text: "Workspace Shell Commands:", type: "system" },
        { id: getLineId(), text: "  ls [path]         List directory contents", type: "stdout" },
        { id: getLineId(), text: "  cd <dir>          Change directory (e.g. cd src)", type: "stdout" },
        { id: getLineId(), text: "  pwd               Print current working directory", type: "stdout" },
        { id: getLineId(), text: "  cat <file>        Display file contents", type: "stdout" },
        { id: getLineId(), text: "  touch <file>      Create a new file in workspace", type: "stdout" },
        { id: getLineId(), text: "  mkdir <dir>       Create a new folder in workspace", type: "stdout" },
        { id: getLineId(), text: "  rm <file>         Delete a file or folder", type: "stdout" },
        { id: getLineId(), text: "  node -v / node    Run Node.js commands", type: "stdout" },
        { id: getLineId(), text: "  whoami            Show current authenticated user", type: "stdout" },
        { id: getLineId(), text: "  clear             Clear terminal screen", type: "stdout" },
      ]);
      return;
    }

    setIsExecuting(true);

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(project.id)}/terminal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          cwd: currentCwd,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setTerminalLines((prev) => [
          ...prev,
          {
            id: getLineId(),
            text: errorData.error || `Process failed with HTTP ${res.status}`,
            type: "stderr",
          },
        ]);
        return;
      }

      const data = await res.json();

      // Update cwd if changed
      if (typeof data.cwd === "string") {
        setCurrentCwd(data.cwd);
      }

      const newOutputLines: TerminalLine[] = [];

      if (data.stdout) {
        const lines = data.stdout.split(/\r?\n/);
        // Remove trailing empty element if newline terminated
        if (lines[lines.length - 1] === "") lines.pop();
        for (const line of lines) {
          newOutputLines.push({
            id: getLineId(),
            text: line,
            type: "stdout",
          });
        }
      }

      if (data.stderr) {
        const lines = data.stderr.split(/\r?\n/);
        if (lines[lines.length - 1] === "") lines.pop();
        for (const line of lines) {
          newOutputLines.push({
            id: getLineId(),
            text: line,
            type: "stderr",
          });
        }
      }

      if (newOutputLines.length > 0) {
        setTerminalLines((prev) => [...prev, ...newOutputLines]);
      }

      // If command modified the filesystem, sync files to UI state
      if (data.updatedFiles && Array.isArray(data.updatedFiles) && onFilesSynced) {
        onFilesSynced(data.updatedFiles);
      }
    } catch (err) {
      setTerminalLines((prev) => [
        ...prev,
        {
          id: getLineId(),
          text: `Command error: ${err instanceof Error ? err.message : "Network failure"}`,
          type: "stderr",
        },
      ]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
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
            {isExecuting && <Loader2 className="w-3 h-3 animate-spin text-amber-400 ml-1" />}
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
            <span>Problems</span>
          </button>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 text-neutral-400">
          {activeTab === "output" && (
            <button
              type="button"
              onClick={onClearConsole}
              title="Clear output console"
              className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {activeTab === "terminal" && (
            <button
              type="button"
              onClick={() => setTerminalLines([])}
              title="Clear terminal"
              className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            title="Close panel"
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
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
            <div className="space-y-0.5 leading-relaxed font-mono">
              {terminalLines.map((line) => (
                <div
                  key={line.id}
                  className={
                    line.type === "command"
                      ? "text-cyan-300 font-semibold"
                      : line.type === "stderr"
                      ? "text-rose-400 whitespace-pre-wrap break-all"
                      : line.type === "system"
                      ? "text-neutral-400 italic"
                      : line.type === "success"
                      ? "text-emerald-400"
                      : "text-neutral-200 whitespace-pre-wrap break-all"
                  }
                >
                  {line.text}
                </div>
              ))}
            </div>

            {/* Prompt input row */}
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 mt-1">
              <span className="text-emerald-400 font-semibold shrink-0 select-none">
                {promptPrefix}
              </span>
              <input
                ref={inputRef}
                type="text"
                disabled={isExecuting}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent text-white outline-none flex-1 font-mono text-xs border-none p-0 disabled:opacity-50"
                autoFocus
                spellCheck={false}
                autoComplete="off"
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
            <span>Workspace is healthy. No unresolved compiler errors or diagnostics detected.</span>
          </div>
        )}
      </div>
    </div>
  );
}
