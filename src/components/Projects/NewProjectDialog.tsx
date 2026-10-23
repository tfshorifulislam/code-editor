"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Terminal as TerminalIcon,
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
} from "lucide-react";
import { cloudApi } from "@/lib/cloud/cloudApi";
import { ProjectTemplate } from "@/types/editor";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("cloud-app");
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [copied, setCopied] = useState(false);

  // Project detection
  const [detectedProjects, setDetectedProjects] = useState<DetectedInfo[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Terminal emulator references
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh project detection helper
  const refreshDetection = useCallback(async (targetId: string) => {
    try {
      const detected = await cloudApi.terminal.detect(targetId);
      setDetectedProjects(detected);
    } catch (err) {
      console.warn("Detection check failed:", err);
    }
  }, []);

  // Initialize terminal session and setup genuine xterm emulator
  useEffect(() => {
    if (!isOpen) {
      // Cleanup on close
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
      wsRef.current = null;
      xtermRef.current = null;
      fitAddonRef.current = null;
      setProjectId(null);
      setSessionId(null);
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
        const sessId = session.sessionId || `pty_init_${Date.now()}`;
        setSessionId(sessId);
        setIsInitializingSession(false);

        // Mount xterm after container element is rendered
        setTimeout(() => {
          if (!isMounted || !terminalContainerRef.current) return;

          // Clear previous DOM children if any
          terminalContainerRef.current.innerHTML = "";

          const term = new XTerm({
            cursorBlink: true,
            cursorStyle: "block",
            cursorInactiveStyle: "outline",
            cursorWidth: 1,
            scrollback: 5000,
            fontFamily: 'Menlo, Monaco, "Courier New", "Fira Code", monospace',
            fontSize: 12,
            letterSpacing: 0.5,
            lineHeight: 1.25,
            theme: {
              background: "#0c0d14",
              foreground: "#d4d4d4",
              cursor: "#ffffff",
              selectionBackground: "#264f78",
              black: "#000000",
              red: "#cd3131",
              green: "#0dbc79",
              yellow: "#e5e510",
              blue: "#2472c8",
              magenta: "#bc3fbc",
              cyan: "#11a8cd",
              white: "#e5e5e5",
              brightBlack: "#666666",
              brightRed: "#f14c4c",
              brightGreen: "#23d18b",
              brightYellow: "#f5f543",
              brightBlue: "#3b8eea",
              brightMagenta: "#d670d6",
              brightCyan: "#29b8db",
              brightWhite: "#ffffff",
            },
            convertEol: true,
            allowProposedApi: true,
          });

          const fitAddon = new FitAddon();
          term.loadAddon(fitAddon);
          term.loadAddon(new WebLinksAddon());

          term.open(terminalContainerRef.current);
          try {
            fitAddon.fit();
            term.focus();
          } catch {}

          xtermRef.current = term;
          fitAddonRef.current = fitAddon;

          // Connect WebSocket to real persistent PTY process
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const hostname = window.location.hostname || "localhost";
          const wsPort = session.wsPort || 3005;
          const wsUrl = `${protocol}//${hostname}:${wsPort}?projectId=${encodeURIComponent(session.projectId)}&sessionId=${encodeURIComponent(sessId)}`;

          let hasReceivedInitBuffer = false;
          let ws: WebSocket | null = null;
          try {
            ws = new WebSocket(wsUrl);
            wsRef.current = ws;
          } catch (e) {
            console.warn("WebSocket creation error in NewProjectDialog:", e);
          }

          if (ws) {
            ws.onopen = () => {
              try {
                fitAddon.fit();
                ws?.send(
                  JSON.stringify({
                    type: "resize",
                    cols: term.cols,
                    rows: term.rows,
                  })
                );
              } catch {}
            };

            ws.onmessage = (event) => {
              try {
                const msg = JSON.parse(event.data);
                if (msg.type === "init") {
                  if (msg.buffer && !hasReceivedInitBuffer) {
                    hasReceivedInitBuffer = true;
                    term.write(msg.buffer);
                  }
                } else if (msg.type === "output" && typeof msg.data === "string") {
                  term.write(msg.data);
                  // Trigger quick detection on output
                  refreshDetection(session.projectId);
                }
              } catch (e) {
                console.warn("WS parse error:", e);
              }
            };

            // Route raw keystrokes directly to persistent PTY
            term.onData((data) => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "input", data }));
              } else {
                cloudApi.terminal.sendSessionInput(session.projectId, sessId, data);
              }
            });

            // Route resize
            term.onResize(({ cols, rows }) => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "resize", cols, rows }));
              }
            });

            // Clipboard integration
            term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
              if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && term.hasSelection()) {
                return false;
              }
              if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v" && event.type === "keydown") {
                navigator.clipboard?.readText?.().then((text) => {
                  if (text && ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "input", data: text }));
                  }
                }).catch(() => {});
                return false;
              }
              return true;
            });
          }

          // Initial detection check
          refreshDetection(session.projectId);

          // Periodic detection check every 2.5 seconds
          detectionIntervalRef.current = setInterval(() => {
            if (session.projectId) {
              refreshDetection(session.projectId);
            }
          }, 2500);
        }, 50);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to initialize terminal session";
        setErrorMsg(msg);
        setIsInitializingSession(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
      wsRef.current = null;
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [isOpen, projectName, refreshDetection]);

  // Window resize handler
  useEffect(() => {
    const onResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {}
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Quick Starter command click: writes command + Enter directly to PTY
  const handleQuickStarter = (cmd: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (projectId && sessionId) {
        cloudApi.terminal.sendSessionInput(projectId, sessionId, cmd + "\r\n");
      }
      return;
    }
    wsRef.current.send(JSON.stringify({ type: "input", data: cmd + "\r\n" }));
    xtermRef.current?.focus();
  };

  // Stop running process (Ctrl+C)
  const handleStopProcess = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "kill" }));
    } else if (projectId) {
      cloudApi.terminal.kill(projectId);
    }
    xtermRef.current?.focus();
  };

  // Clear terminal (Ctrl+L)
  const handleClearLogs = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data: "\x0c" }));
    }
    xtermRef.current?.focus();
  };

  // Copy terminal buffer
  const handleCopyLogs = () => {
    if (!xtermRef.current) return;
    xtermRef.current.selectAll();
    const selection = xtermRef.current.getSelection();
    xtermRef.current.clearSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();

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
              <TerminalIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">New Project Terminal</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  Real Persistent Shell
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Execute official CLIs with live interactive keyboard menus, arrow navigation, and full OS compatibility.
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
              disabled={isInitializingSession}
              className="bg-[#1a1d28] border border-neutral-700/80 focus:border-[var(--color-primary)] focus:bg-[#1f2332] rounded-md px-2.5 py-1 text-xs text-white font-medium outline-none transition w-44 sm:w-56"
            />
          </div>

          {/* Working Directory Indicator */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400 bg-neutral-900/80 px-2.5 py-1 rounded border border-neutral-800">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-500">cwd:</span>
            <span className="text-emerald-400 font-semibold">~/workspace</span>
          </div>

          {/* Terminal Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleStopProcess}
              className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Stop running command (Ctrl+C)"
            >
              <Square className="w-2.5 h-2.5 fill-rose-400" />
              <span>Ctrl+C</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLogs}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Copy terminal buffer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleClearLogs}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Clear terminal (Ctrl+L)"
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
                disabled={isInitializingSession}
                onClick={() => handleQuickStarter(qc.cmd)}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-neutral-700 hover:border-neutral-500 bg-[#1e2230] hover:bg-[#252b3d] text-neutral-200 transition shrink-0 cursor-pointer flex items-center gap-1.5"
                title={`Run: ${qc.cmd}`}
              >
                <span className="font-sans font-semibold text-white">{qc.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                  {qc.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pure xterm.js Terminal Window Container */}
        <div
          className="flex-1 min-h-[340px] max-h-[460px] p-3 bg-[#0c0d14] relative overflow-hidden cursor-text select-text"
          onClick={() => xtermRef.current?.focus()}
        >
          {isInitializingSession && (
            <div className="absolute inset-0 bg-[#0c0d14]/90 z-10 flex items-center justify-center gap-2 text-neutral-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Provisioning persistent shell environment...</span>
            </div>
          )}

          <div
            ref={terminalContainerRef}
            className="w-full h-full overflow-hidden"
          />
        </div>

        {/* Bottom Status & Open in Editor Bar */}
        <div className="px-5 py-3 bg-[#161824] border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Project Detection Badge */}
          <div className="flex items-center gap-2">
            {hasFiles ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">
                  {topDetected.frameworkLabel}
                </span>
                <span className="text-neutral-400 text-[11px]">
                  ({topDetected.fileCount} {topDetected.fileCount === 1 ? "file" : "files"} detected)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Type commands in the terminal above or click a Quick Starter to generate files.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!hasFiles || isFinalizing}
              onClick={handleOpenProjectInEditor}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                hasFiles
                  ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Configuring Project...</span>
                </>
              ) : (
                <>
                  <span>Open in Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="px-5 py-2 bg-rose-950/60 border-t border-rose-900 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
