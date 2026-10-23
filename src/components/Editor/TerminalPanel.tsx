"use client";

import React, { useState, useRef, useEffect, useCallback, type MouseEvent } from "react";
import {
  Terminal as TerminalIcon,
  AlertCircle,
  FileText,
  Trash2,
  X,
  Plus,
  Square,
  Maximize2,
  Minimize2,
  ChevronDown,
  Folder,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { BottomTab, ConsoleMessage, Project, ProjectFile, ShellType, TerminalTabInfo, AvailableShell } from "@/types/editor";
import { cloudApi } from "@/lib/cloud/cloudApi";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

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

interface SessionTerminalInstance {
  term: XTerm;
  fitAddon: FitAddon;
  inputBuffer: string;
  history: string[];
  historyIndex: number;
  isRunning: boolean;
  cwd: string;
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
  // Panel dimensions and resize state
  const [panelHeight, setPanelHeight] = useState<number>(240);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startDragYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(240);

  // Terminal sessions state
  const [sessions, setSessions] = useState<TerminalTabInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [availableShells, setAvailableShells] = useState<AvailableShell[]>([]);
  const [isShellMenuOpen, setIsShellMenuOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Map of active xterm instances per session ID
  const instancesRef = useRef<Map<string, SessionTerminalInstance>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Helper to format prompt
  const getPrompt = useCallback((cwd: string) => {
    const cleanCwd = (cwd || "").replace(/\\/g, "/").replace(/^\/+/, "");
    return cleanCwd ? `\x1b[32m~/project/${cleanCwd}\x1b[0m \x1b[35m$\x1b[0m ` : `\x1b[32m~/project\x1b[0m \x1b[35m$\x1b[0m `;
  }, []);

  // Fetch or initialize sessions
  const loadSessions = useCallback(async () => {
    try {
      const data = await cloudApi.terminal.getSessions(project.id);
      setSessions(data.sessions);
      setAvailableShells(data.availableShells);

      if (data.sessions.length > 0) {
        setActiveSessionId((prev) => {
          if (prev && data.sessions.some((s) => s.id === prev)) return prev;
          return data.sessions[0].id;
        });
      }
    } catch (err) {
      console.warn("Failed to load terminal sessions:", err);
    }
  }, [project.id]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  // Execute command in a session
  const executeCommand = useCallback(
    async (sessionId: string, cmdToRun: string) => {
      const instance = instancesRef.current.get(sessionId);
      if (!instance) return;

      const trimmed = cmdToRun.trim();
      if (!trimmed) {
        instance.term.write(`\r\n${getPrompt(instance.cwd)}`);
        return;
      }

      // Record in command history
      if (instance.history.length === 0 || instance.history[instance.history.length - 1] !== trimmed) {
        instance.history.push(trimmed);
      }
      instance.historyIndex = -1;

      // Check client-side clear
      if (trimmed === "clear" || trimmed === "cls") {
        instance.term.clear();
        instance.term.write(getPrompt(instance.cwd));
        return;
      }

      instance.isRunning = true;
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, isRunning: true } : s))
      );

      const controller = new AbortController();
      abortControllersRef.current.set(sessionId, controller);

      try {
        await cloudApi.terminal.executeSessionStream(
          project.id,
          sessionId,
          trimmed,
          (event) => {
            if (event.type === "stdout" && event.data) {
              instance.term.write(event.data);
            } else if (event.type === "stderr" && event.data) {
              instance.term.write(event.data);
            } else if (event.type === "cwd" && typeof event.cwd === "string") {
              instance.cwd = event.cwd;
              setSessions((prev) =>
                prev.map((s) => (s.id === sessionId ? { ...s, cwd: event.cwd! } : s))
              );
            } else if (event.type === "sync" && event.updatedFiles && onFilesSynced) {
              onFilesSynced(event.updatedFiles);
            } else if (event.type === "exit") {
              instance.isRunning = false;
              if (typeof event.cwd === "string") {
                instance.cwd = event.cwd;
              }
              if (event.updatedFiles && onFilesSynced) {
                onFilesSynced(event.updatedFiles);
              }
              setSessions((prev) =>
                prev.map((s) => (s.id === sessionId ? { ...s, isRunning: false, cwd: instance.cwd } : s))
              );
              instance.term.write(`\r\n${getPrompt(instance.cwd)}`);
            } else if (event.type === "error") {
              instance.isRunning = false;
              setSessions((prev) =>
                prev.map((s) => (s.id === sessionId ? { ...s, isRunning: false } : s))
              );
              instance.term.write(`\r\n\x1b[31m${event.data || "Unknown process error"}\x1b[0m\r\n${getPrompt(instance.cwd)}`);
            }
          },
          controller.signal
        );
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          const msg = err instanceof Error ? err.message : String(err);
          instance.term.write(`\r\n\x1b[31mExecution failed: ${msg}\x1b[0m\r\n${getPrompt(instance.cwd)}`);
        }
      } finally {
        instance.isRunning = false;
        abortControllersRef.current.delete(sessionId);
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, isRunning: false } : s))
        );
      }
    },
    [project.id, getPrompt, onFilesSynced]
  );

  // Initialize or attach xterm for active session
  useEffect(() => {
    if (!isOpen || activeTab !== "terminal" || !activeSessionId || !containerRef.current) {
      return;
    }

    const sessionInfo = sessions.find((s) => s.id === activeSessionId);
    if (!sessionInfo) return;

    let instance = instancesRef.current.get(activeSessionId);

    if (!instance) {
      // Create new xterm instance
      const term = new XTerm({
        cursorBlink: true,
        cursorStyle: "block",
        fontFamily: 'Menlo, Monaco, "Courier New", "Fira Code", monospace',
        fontSize: 12,
        letterSpacing: 0.5,
        lineHeight: 1.25,
        theme: {
          background: "#181818",
          foreground: "#cccccc",
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

      instance = {
        term,
        fitAddon,
        inputBuffer: "",
        history: [],
        historyIndex: -1,
        isRunning: false,
        cwd: sessionInfo.cwd || "",
      };

      instancesRef.current.set(activeSessionId, instance);

      // Render welcome banner and prompt
      term.write(`\x1b[38;2;130;80;223m[Antigravity Cloud IDE]\x1b[0m Integrated Terminal (${sessionInfo.shellType})\r\n`);
      term.write(`\x1b[90mWorkspace Root: ~/project | Shell: ${sessionInfo.name}\x1b[0m\r\n\r\n`);
      term.write(getPrompt(instance.cwd));

      // Handle keyboard and user data input
      term.onData((data) => {
        const inst = instancesRef.current.get(activeSessionId);
        if (!inst) return;

        // If foreground process is running, pipe raw stdin directly
        if (inst.isRunning) {
          if (data === "\x03") {
            // Ctrl+C
            cloudApi.terminal.killSession(project.id, activeSessionId);
            inst.term.write("^C\r\n");
            return;
          }
          cloudApi.terminal.sendSessionInput(project.id, activeSessionId, data);
          return;
        }

        // Standard shell line editing
        if (data === "\r") {
          // Enter key
          const cmd = inst.inputBuffer;
          inst.inputBuffer = "";
          inst.historyIndex = -1;
          inst.term.write("\r\n");
          executeCommand(activeSessionId, cmd);
        } else if (data === "\x7f" || data === "\b") {
          // Backspace
          if (inst.inputBuffer.length > 0) {
            inst.inputBuffer = inst.inputBuffer.slice(0, -1);
            inst.term.write("\b \b");
          }
        } else if (data === "\x03") {
          // Ctrl+C when idle
          inst.inputBuffer = "";
          inst.term.write("^C\r\n" + getPrompt(inst.cwd));
        } else if (data === "\x0c") {
          // Ctrl+L (clear screen)
          inst.term.clear();
          inst.term.write(getPrompt(inst.cwd) + inst.inputBuffer);
        } else if (data === "\x1b[A") {
          // Up Arrow - navigate history
          if (inst.history.length > 0) {
            const nextIdx = inst.historyIndex < inst.history.length - 1 ? inst.historyIndex + 1 : inst.historyIndex;
            inst.historyIndex = nextIdx;
            const pastCmd = inst.history[inst.history.length - 1 - nextIdx] || "";
            // Clear current line
            inst.term.write(`\r\x1b[2K${getPrompt(inst.cwd)}${pastCmd}`);
            inst.inputBuffer = pastCmd;
          }
        } else if (data === "\x1b[B") {
          // Down Arrow - navigate history
          if (inst.historyIndex > 0) {
            const nextIdx = inst.historyIndex - 1;
            inst.historyIndex = nextIdx;
            const pastCmd = inst.history[inst.history.length - 1 - nextIdx] || "";
            inst.term.write(`\r\x1b[2K${getPrompt(inst.cwd)}${pastCmd}`);
            inst.inputBuffer = pastCmd;
          } else if (inst.historyIndex === 0) {
            inst.historyIndex = -1;
            inst.term.write(`\r\x1b[2K${getPrompt(inst.cwd)}`);
            inst.inputBuffer = "";
          }
        } else if (data >= " " || data === "\t") {
          // Printable characters or tab
          inst.inputBuffer += data;
          inst.term.write(data);
        }
      });
    }

    // Attach to DOM container
    containerRef.current.innerHTML = "";
    instance.term.open(containerRef.current);

    setTimeout(() => {
      try {
        instance?.fitAddon.fit();
        instance?.term.focus();
      } catch {}
    }, 50);
  }, [isOpen, activeTab, activeSessionId, sessions, project.id, getPrompt, executeCommand]);

  // Window or panel resize handler
  useEffect(() => {
    const handleResize = () => {
      if (activeSessionId) {
        const inst = instancesRef.current.get(activeSessionId);
        try {
          inst?.fitAddon.fit();
        } catch {}
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeSessionId]);

  // Handle Drag Resizing
  const handleMouseDownResize = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startDragYRef.current = e.clientY;
    startHeightRef.current = panelHeight;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaY = startDragYRef.current - moveEvent.clientY;
      const maxHeight = window.innerHeight * 0.85;
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 140), maxHeight);
      setPanelHeight(newHeight);

      if (activeSessionId) {
        const inst = instancesRef.current.get(activeSessionId);
        try {
          inst?.fitAddon.fit();
        } catch {}
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Create new session
  const handleCreateSession = async (shellType?: ShellType) => {
    setIsShellMenuOpen(false);
    try {
      const res = await cloudApi.terminal.createSession(project.id, shellType);
      await loadSessions();
      setActiveSessionId(res.session.id);
    } catch (err) {
      console.warn("Failed to create session:", err);
    }
  };

  // Close session tab
  const handleCloseSession = async (e: MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      // Clean up instance
      const inst = instancesRef.current.get(sessionId);
      if (inst) {
        inst.term.dispose();
        instancesRef.current.delete(sessionId);
      }

      await cloudApi.terminal.closeSession(project.id, sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0]?.id || "");
      }
    } catch (err) {
      console.warn("Failed to close session:", err);
    }
  };

  // Rename session tab
  const handleRenameSessionSubmit = async (sessionId: string) => {
    if (!editingName.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      await cloudApi.terminal.renameSession(project.id, sessionId, editingName.trim());
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, name: editingName.trim() } : s))
      );
    } catch (err) {
      console.warn("Failed to rename session:", err);
    } finally {
      setEditingSessionId(null);
    }
  };

  // Kill running process in active session
  const handleKillActive = async () => {
    if (!activeSessionId) return;
    try {
      await cloudApi.terminal.killSession(project.id, activeSessionId);
      const inst = instancesRef.current.get(activeSessionId);
      if (inst) {
        inst.isRunning = false;
        inst.term.write("^C\r\n" + getPrompt(inst.cwd));
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, isRunning: false } : s))
      );
    } catch (err) {
      console.warn("Failed to kill session process:", err);
    }
  };

  // Clear active terminal
  const handleClearActive = () => {
    if (!activeSessionId) return;
    const inst = instancesRef.current.get(activeSessionId);
    if (inst) {
      inst.term.clear();
      inst.term.write(getPrompt(inst.cwd));
    }
  };

  if (!isOpen) return null;

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentHeight = isMaximized ? "85vh" : `${panelHeight}px`;

  return (
    <div
      style={{ height: currentHeight }}
      className="bg-[#181818] border-t border-[#2b2b2b] flex flex-col font-sans text-xs select-none shrink-0 z-20 relative transition-all duration-75"
    >
      {/* Top Drag Handle for Resizing */}
      <div
        onMouseDown={handleMouseDownResize}
        onDoubleClick={() => setIsMaximized((prev) => !prev)}
        className={`h-1.5 w-full absolute -top-1 left-0 cursor-ns-resize z-30 transition-colors ${
          isDragging ? "bg-[var(--color-primary)]" : "hover:bg-[var(--color-primary)]/70"
        }`}
        title="Drag to resize terminal panel (double click to maximize)"
      />

      {/* Main Panel Toolbar */}
      <div className="h-8 bg-[#252526] border-b border-[#1e1e1e] px-2.5 flex items-center justify-between shrink-0">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectTab("terminal")}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-t font-medium transition cursor-pointer text-xs ${
              activeTab === "terminal"
                ? "bg-[#181818] text-white border-t-2 border-t-[var(--color-primary)] font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
            {activeSession?.isRunning && (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("output")}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-t font-medium transition cursor-pointer text-xs ${
              activeTab === "output"
                ? "bg-[#181818] text-white border-t-2 border-t-[var(--color-primary)] font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Output / Console</span>
            {consoleMessages.length > 0 && (
              <span className="text-[10px] px-1 bg-neutral-700 rounded-full font-mono">
                {consoleMessages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("problems")}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-t font-medium transition cursor-pointer text-xs ${
              activeTab === "problems"
                ? "bg-[#181818] text-white border-t-2 border-t-[var(--color-primary)] font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Problems</span>
          </button>
        </div>

        {/* Center: Terminal Tab Pills (VS Code Multiple Terminals) */}
        {activeTab === "terminal" && sessions.length > 0 && (
          <div className="flex items-center gap-1.5 max-w-[50%] overflow-x-auto no-scrollbar py-0.5">
            {sessions.map((sess) => {
              const isSelected = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  onDoubleClick={() => {
                    setEditingSessionId(sess.id);
                    setEditingName(sess.name);
                  }}
                  className={`group flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer border transition ${
                    isSelected
                      ? "bg-[#1e1e1e] border-neutral-700 text-white font-medium"
                      : "bg-[#2d2d2d]/60 border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#2d2d2d]"
                  }`}
                  title="Click to switch, double click to rename"
                >
                  {sess.isRunning ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                  )}

                  {editingSessionId === sess.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRenameSessionSubmit(sess.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSessionSubmit(sess.id);
                        if (e.key === "Escape") setEditingSessionId(null);
                      }}
                      className="bg-black/60 text-white text-[10px] px-1 rounded outline-none border border-[var(--color-primary)] w-20"
                    />
                  ) : (
                    <span>{sess.name}</span>
                  )}

                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleCloseSession(e, sess.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                      title="Kill and close terminal tab"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Right: Actions Toolbar */}
        <div className="flex items-center gap-1 text-neutral-400">
          {activeTab === "terminal" && (
            <>
              {/* Working Directory Indicator */}
              {activeSession && (
                <div className="hidden lg:flex items-center gap-1 font-mono text-[11px] text-neutral-400 bg-black/40 px-2 py-0.5 rounded mr-1 border border-neutral-800">
                  <Folder className="w-3 h-3 text-amber-400" />
                  <span className="text-emerald-400">~/project{activeSession.cwd ? `/${activeSession.cwd}` : ""}</span>
                </div>
              )}

              {/* Stop Running Process (Ctrl+C) */}
              {activeSession?.isRunning && (
                <button
                  type="button"
                  onClick={handleKillActive}
                  title="Kill foreground process (Ctrl+C)"
                  className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Square className="w-2.5 h-2.5 fill-rose-400" />
                  <span>Kill</span>
                </button>
              )}

              {/* New Terminal Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsShellMenuOpen((prev) => !prev)}
                  title="New Terminal"
                  className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>

                {isShellMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-48 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-xl py-1 z-50 text-xs font-mono"
                  >
                    <div className="px-2.5 py-1 text-[10px] text-neutral-400 font-sans uppercase font-bold border-b border-[#333333]">
                      Available Shells
                    </div>
                    {availableShells.map((sh) => (
                      <button
                        key={sh.type + sh.label}
                        type="button"
                        onClick={() => handleCreateSession(sh.type)}
                        className="w-full text-left px-3 py-1.5 text-neutral-300 hover:text-white hover:bg-[var(--color-primary)]/20 transition cursor-pointer flex items-center justify-between"
                      >
                        <span>{sh.label}</span>
                        <span className="text-[10px] text-neutral-500 font-sans">
                          {sh.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Terminal */}
              <button
                type="button"
                onClick={handleClearActive}
                title="Clear terminal (Ctrl+L)"
                className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

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

          {/* Maximize / Restore Button */}
          <button
            type="button"
            onClick={() => setIsMaximized((prev) => !prev)}
            title={isMaximized ? "Restore panel size" : "Maximize panel"}
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close Panel Button */}
          <button
            type="button"
            onClick={onToggle}
            title="Hide panel"
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Panel Content Body */}
      <div className="flex-1 overflow-hidden relative bg-[#181818]">
        {/* Terminal Tab: Genuine xterm.js Canvas / DOM */}
        {activeTab === "terminal" && (
          <div
            ref={containerRef}
            className="w-full h-full p-2 overflow-hidden cursor-text"
            onClick={() => {
              if (activeSessionId) {
                instancesRef.current.get(activeSessionId)?.term.focus();
              }
            }}
          />
        )}

        {/* Output / Console Tab Content */}
        {activeTab === "output" && (
          <div className="h-full overflow-y-auto p-3 text-neutral-300 font-mono text-xs space-y-1">
            {consoleMessages.length === 0 ? (
              <div className="text-neutral-500 italic py-2">
                No runtime logs yet. Preview activity and system events will appear here.
              </div>
            ) : (
              consoleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 py-0.5 ${
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
          </div>
        )}

        {/* Problems Tab Content */}
        {activeTab === "problems" && (
          <div className="h-full overflow-y-auto p-4 flex items-center gap-2 text-neutral-400 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Workspace is healthy. No unresolved compiler errors or diagnostics detected.</span>
          </div>
        )}
      </div>
    </div>
  );
}
