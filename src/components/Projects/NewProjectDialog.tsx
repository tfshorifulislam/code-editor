"use client";

import React, { useState, useEffect, useRef, useCallback, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Terminal,
  Play,
  Square,
  Copy,
  Trash2,
  Folder,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  CornerDownLeft,
} from "lucide-react";
import { cloudApi } from "@/lib/cloud/cloudApi";
import { parseAnsiToSpans } from "@/lib/utils/ansi";
import { ProjectTemplate } from "@/types/editor";

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}

interface LogEntry {
  id: string;
  type: "command" | "stdout" | "stderr" | "info" | "system";
  text: string;
  cwd?: string;
}

interface DetectedInfo {
  path: string;
  name: string;
  template: ProjectTemplate;
  frameworkLabel: string;
  fileCount: number;
  entryFile?: string;
}

const QUICK_COMMANDS = [
  {
    label: "Next.js App",
    cmd: "npx create-next-app@latest . --ts --tailwind --eslint --app --use-npm --yes",
    badge: "Full-Stack",
  },
  {
    label: "React + Vite",
    cmd: "npm create vite@latest . -- --template react-ts",
    badge: "Frontend",
  },
  {
    label: "Node.js API",
    cmd: "npm init -y && npm install express dotenv",
    badge: "Backend",
  },
  {
    label: "Check Toolchain",
    cmd: "node -v && npm -v && git --version",
    badge: "System",
  },
  {
    label: "Git Init",
    cmd: "git init",
    badge: "Git",
  },
];

export default function NewProjectDialog({
  isOpen,
  onClose,
  onCreated,
}: NewProjectDialogProps) {
  const router = useRouter();

  // Session state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("cloud-app");
  const [cwd, setCwd] = useState<string>("");
  const [isInitializingSession, setIsInitializingSession] = useState(false);

  // Terminal state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState(false);

  // Project detection
  const [detectedProjects, setDetectedProjects] = useState<DetectedInfo[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll terminal
  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Check detection helper
  const refreshDetection = useCallback(async (targetId: string) => {
    try {
      const detected = await cloudApi.terminal.detect(targetId);
      setDetectedProjects(detected);
    } catch (err) {
      console.warn("Detection check failed:", err);
    }
  }, []);

  // Initialize session when dialog opens
  useEffect(() => {
    if (!isOpen) {
      setProjectId(null);
      setLogs([]);
      setIsRunning(false);
      setDetectedProjects([]);
      return;
    }

    let isMounted = true;
    setIsInitializingSession(true);
    setErrorMsg(null);

    const init = async () => {
      try {
        const session = await cloudApi.terminal.startSession(projectName || "cloud-app");
        if (!isMounted) return;

        setProjectId(session.projectId);
        setCwd(session.cwd);
        setLogs([
          {
            id: "sys-welcome",
            type: "system",
            text: "Antigravity Cloud Interactive Shell v2.4 (x86_64-pc)\n" +
                  `Workspace root: ~/workspace (${session.projectId})\n` +
                  "Run any command (e.g. npx create-next-app, npm create vite, npm init) to create your project.\n",
          },
        ]);
        await refreshDetection(session.projectId);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to initialize terminal session";
        setErrorMsg(msg);
      } finally {
        if (isMounted) setIsInitializingSession(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen]);

  // Execute or send input
  const handleExecute = async (cmdToRun?: string) => {
    const rawCmd = (cmdToRun !== undefined ? cmdToRun : inputVal).trim();
    if (!projectId) return;

    // If currently running, treat input as stdin
    if (isRunning) {
      if (rawCmd) {
        setLogs((prev) => [
          ...prev,
          { id: `stdin-${Date.now()}`, type: "command", text: rawCmd, cwd },
        ]);
        setInputVal("");
        await cloudApi.terminal.sendInput(projectId, rawCmd);
      }
      return;
    }

    if (!rawCmd) return;

    // Built-in `clear` command
    if (rawCmd === "clear" || rawCmd === "cls") {
      setLogs([]);
      setInputVal("");
      return;
    }

    // Add to command history
    setHistory((prev) => [rawCmd, ...prev]);
    setHistoryIndex(-1);
    setInputVal("");
    setIsRunning(true);
    setErrorMsg(null);

    // Append command to log
    setLogs((prev) => [
      ...prev,
      { id: `cmd-${Date.now()}`, type: "command", text: rawCmd, cwd },
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await cloudApi.terminal.executeStream(
        projectId,
        rawCmd,
        cwd,
        (event) => {
          if (event.type === "stdout" && event.data) {
            setLogs((prev) => [
              ...prev,
              { id: `stdout-${Date.now()}-${Math.random()}`, type: "stdout", text: event.data! },
            ]);
          } else if (event.type === "stderr" && event.data) {
            setLogs((prev) => [
              ...prev,
              { id: `stderr-${Date.now()}-${Math.random()}`, type: "stderr", text: event.data! },
            ]);
          } else if (event.type === "cwd" && typeof event.cwd === "string") {
            setCwd(event.cwd);
          } else if (event.type === "exit") {
            setIsRunning(false);
            if (typeof event.cwd === "string") {
              setCwd(event.cwd);
            }
            if (event.exitCode !== 0) {
              setLogs((prev) => [
                ...prev,
                {
                  id: `exit-${Date.now()}`,
                  type: "info",
                  text: `[Process exited with non-zero code ${event.exitCode}]\n`,
                },
              ]);
            }
            // Trigger project detection
            refreshDetection(projectId);
          } else if (event.type === "error") {
            setIsRunning(false);
            setLogs((prev) => [
              ...prev,
              { id: `err-${Date.now()}`, type: "stderr", text: event.data || "Unknown process error\n" },
            ]);
          }
        },
        controller.signal
      );
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        const msg = err instanceof Error ? err.message : String(err);
        setLogs((prev) => [
          ...prev,
          { id: `catch-${Date.now()}`, type: "stderr", text: `Error: ${msg}\n` },
        ]);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
      refreshDetection(projectId);
      inputRef.current?.focus();
    }
  };

  // Keyboard navigation for command history
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal("");
      }
    } else if (e.key === "c" && e.ctrlKey) {
      // Ctrl+C kill
      if (isRunning && projectId) {
        e.preventDefault();
        handleStopProcess();
      }
    }
  };

  const handleStopProcess = async () => {
    if (!projectId) return;
    try {
      await cloudApi.terminal.kill(projectId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setLogs((prev) => [
        ...prev,
        { id: `kill-${Date.now()}`, type: "info", text: "^C [Process terminated by user]\n" },
      ]);
      setIsRunning(false);
      refreshDetection(projectId);
    } catch (err) {
      console.warn("Failed to kill process:", err);
    }
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => l.text).join("");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Finalize and Open in Editor
  const handleOpenProjectInEditor = async () => {
    if (!projectId) return;
    setIsFinalizing(true);
    setErrorMsg(null);

    try {
      const topProject = detectedProjects[0];
      const subfolder = topProject && topProject.path ? topProject.path : undefined;

      const result = await cloudApi.terminal.finalize(projectId, {
        name: projectName.trim() || topProject?.name || "cloud-app",
        subfolder,
      });

      onClose();
      if (onCreated) {
        onCreated(result.projectId);
      } else {
        router.push(result.redirectUrl || `/editor/${result.projectId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to finalize project setup";
      setErrorMsg(msg);
      setIsFinalizing(false);
    }
  };

  // Safe Cancel and Cleanup
  const handleCancel = async () => {
    if (projectId) {
      // Stop running process and cleanup workspace if empty
      if (isRunning) {
        await cloudApi.terminal.kill(projectId).catch(() => {});
      }
      if (detectedProjects.length === 0 || detectedProjects[0]?.fileCount === 0) {
        await cloudApi.terminal.cleanup(projectId).catch(() => {});
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const topDetected = detectedProjects[0];
  const hasFiles = Boolean(topDetected && topDetected.fileCount > 0);

  return (
    <div
      onClick={handleCancel}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#0f1117] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col text-neutral-200 overflow-hidden max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 flex items-center justify-center text-[var(--color-primary)] shadow-xs">
              <Terminal className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">New Project Terminal</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Interactive Cloud Shell
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Run official CLIs (Next.js, Vite, Express, Python) to initialize your workspace on real disk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/80 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Project Name & Path Bar */}
        <div className="px-5 py-2.5 bg-[#12141d] border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Project Name Input */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Project Name:</span>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. my-awesome-app"
              disabled={isInitializingSession || isRunning}
              className="bg-[#1a1d28] border border-neutral-700/80 focus:border-[var(--color-primary)] focus:bg-[#1f2332] rounded-md px-2.5 py-1 text-xs text-white font-medium outline-none transition w-44 sm:w-56"
            />
          </div>

          {/* Working Directory Indicator */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400 bg-neutral-900/80 px-2.5 py-1 rounded border border-neutral-800">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-500">cwd:</span>
            <span className="text-emerald-400 font-semibold">
              ~/workspace{cwd ? `/${cwd}` : ""}
            </span>
          </div>

          {/* Terminal Action Buttons */}
          <div className="flex items-center gap-1.5">
            {isRunning && (
              <button
                type="button"
                onClick={handleStopProcess}
                className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                title="Stop running command (Ctrl+C)"
              >
                <Square className="w-3 h-3 fill-rose-400" />
                <span>Stop</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLogs}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Copy terminal output"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleClearLogs}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Clear terminal"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Quick Starters Bar */}
        <div className="px-5 py-2 bg-[#141620] border-b border-neutral-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
            <span>Quick Starters:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-nowrap">
            {QUICK_COMMANDS.map((qc) => (
              <button
                key={qc.label}
                type="button"
                disabled={isRunning || isInitializingSession}
                onClick={() => {
                  setInputVal(qc.cmd);
                  inputRef.current?.focus();
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-neutral-700 hover:border-neutral-500 bg-[#1e2230] hover:bg-[#252b3d] text-neutral-200 transition shrink-0 cursor-pointer flex items-center gap-1.5"
                title={`Paste command: ${qc.cmd}`}
              >
                <span className="font-sans font-semibold text-white">{qc.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                  {qc.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Window Content */}
        <div className="flex-1 min-h-[300px] max-h-[460px] p-4 bg-[#0a0c10] font-mono text-[12px] leading-relaxed overflow-y-auto selection:bg-purple-900 selection:text-white select-text">
          {isInitializingSession && (
            <div className="py-6 flex items-center justify-center gap-2 text-neutral-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Provisioning isolated physical workspace...</span>
            </div>
          )}

          {logs.map((log) => {
            if (log.type === "command") {
              return (
                <div key={log.id} className="text-neutral-300 py-0.5 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold select-none">
                    ~/workspace{log.cwd ? `/${log.cwd}` : ""} $
                  </span>
                  <span className="text-white font-semibold">{log.text}</span>
                </div>
              );
            }

            if (log.type === "system") {
              return (
                <div key={log.id} className="text-neutral-500 py-1 whitespace-pre-wrap">
                  {log.text}
                </div>
              );
            }

            if (log.type === "info") {
              return (
                <div key={log.id} className="text-amber-400 py-0.5 whitespace-pre-wrap font-medium">
                  {log.text}
                </div>
              );
            }

            if (log.type === "stderr") {
              const spans = parseAnsiToSpans(log.text);
              return (
                <div key={log.id} className="text-rose-400 whitespace-pre-wrap">
                  {spans.map((s, idx) => (
                    <span
                      key={idx}
                      style={{ color: s.color }}
                      className={`${s.bold ? "font-bold" : ""} ${s.dim ? "opacity-75" : ""}`}
                    >
                      {s.text}
                    </span>
                  ))}
                </div>
              );
            }

            // stdout
            const spans = parseAnsiToSpans(log.text);
            return (
              <span key={log.id} className="text-neutral-200 whitespace-pre-wrap">
                {spans.map((s, idx) => (
                  <span
                    key={idx}
                    style={{ color: s.color }}
                    className={`${s.bold ? "font-bold" : ""} ${s.dim ? "opacity-75" : ""}`}
                  >
                    {s.text}
                  </span>
                ))}
              </span>
            );
          })}

          {/* Running Indicator */}
          {isRunning && (
            <div className="flex items-center gap-2 text-purple-400 text-[11px] py-1 select-none animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Executing command in cloud sandbox...</span>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Bar */}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            handleExecute();
          }}
          className="p-3 bg-[#12141c] border-t border-neutral-800 flex items-center gap-2"
        >
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400 shrink-0 select-none">
            <span>~/workspace{cwd ? `/${cwd}` : ""} $</span>
          </div>

          <input
            ref={inputRef}
            type="text"
            autoFocus
            disabled={isInitializingSession}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRunning
                ? "Send input to running command (stdin)..."
                : "Type command (e.g. npx create-next-app@latest . --yes) or click a quick starter..."
            }
            className="flex-1 bg-transparent border-0 text-white font-mono text-xs outline-none placeholder:text-neutral-600 focus:ring-0"
          />

          <button
            type="submit"
            disabled={isInitializingSession}
            className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
          >
            {isRunning ? (
              <>
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Send</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>Run</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Status & Open in Editor Bar */}
        <div className="px-5 py-3 bg-[#161824] border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Project Detection Badge */}
          <div className="flex items-center gap-2">
            {hasFiles ? (
              <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300">
                    {topDetected.frameworkLabel || "Project Detected"}
                  </span>
                  <span className="text-emerald-400/80 text-[11px] ml-1.5">
                    ({topDetected.fileCount} {topDetected.fileCount === 1 ? "file" : "files"} ready
                    {topDetected.path ? ` in ./${topDetected.path}` : ""})
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
                <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>
                  No project files detected yet. Run a scaffold command or click a starter above.
                </span>
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-rose-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer font-medium text-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!hasFiles || isFinalizing || isRunning}
              onClick={handleOpenProjectInEditor}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-md ${
                hasFiles && !isFinalizing && !isRunning
                  ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white ring-2 ring-[var(--color-primary)]/40 shadow-purple-900/40"
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/60"
              }`}
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing Workspace & Launching...</span>
                </>
              ) : (
                <>
                  <span>Open Project in Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
