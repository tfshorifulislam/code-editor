import { spawn, ChildProcess, exec } from "child_process";
import path from "path";
import fsp from "fs/promises";
import fs from "fs";
import { getWorkspaceDir, resolveSafePath, syncDiskToDatabase } from "./workspaceDisk";
import { ProjectFile, ShellType, TerminalTabInfo, AvailableShell } from "@/types/editor";

export interface StreamEvent {
  type: "stdout" | "stderr" | "exit" | "cwd" | "error" | "sync" | "init";
  data?: string;
  exitCode?: number;
  cwd?: string;
  sessionId?: string;
  updatedFiles?: ProjectFile[];
}

export interface TerminalSession {
  id: string;
  name: string;
  projectId: string;
  shellType: ShellType;
  shellPath: string;
  cwd: string; // relative to workspace root
  history: string[];
  recentBuffer: string[];
  activeProcess?: {
    child: ChildProcess;
    pid: number;
    command: string;
    startedAt: number;
  };
  lastActive: number;
}

// Global project sessions registry: Map<projectId, Map<sessionId, TerminalSession>>
const projectSessions = new Map<string, Map<string, TerminalSession>>();

/**
 * Detects all valid shells available on the host operating system.
 */
export function getAvailableShells(): AvailableShell[] {
  const isWindows = process.platform === "win32";

  if (isWindows) {
    const list: AvailableShell[] = [
      {
        type: "powershell",
        label: "PowerShell",
        path: process.env.SystemRoot
          ? path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
          : "powershell.exe",
      },
      {
        type: "cmd",
        label: "Command Prompt (cmd)",
        path: process.env.ComSpec || "cmd.exe",
      },
    ];

    // Check Git Bash
    const gitBashCandidates = [
      "C:\\Program Files\\Git\\bin\\bash.exe",
      "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Git", "bin", "bash.exe"),
    ];

    for (const p of gitBashCandidates) {
      if (fs.existsSync(p)) {
        list.push({
          type: "bash",
          label: "Git Bash",
          path: p,
        });
        break;
      }
    }

    return list;
  } else {
    const list: AvailableShell[] = [
      {
        type: "bash",
        label: "Bash",
        path: fs.existsSync("/bin/bash") ? "/bin/bash" : "/usr/bin/bash",
      },
      {
        type: "sh",
        label: "POSIX Shell (sh)",
        path: "/bin/sh",
      },
    ];

    if (fs.existsSync("/bin/zsh") || fs.existsSync("/usr/bin/zsh")) {
      list.push({
        type: "bash",
        label: "Zsh",
        path: fs.existsSync("/bin/zsh") ? "/bin/zsh" : "/usr/bin/zsh",
      });
    }

    return list;
  }
}

/**
 * Gets or initializes the sessions map for a project.
 */
function getProjectSessionsMap(projectId: string): Map<string, TerminalSession> {
  let map = projectSessions.get(projectId);
  if (!map) {
    map = new Map<string, TerminalSession>();
    projectSessions.set(projectId, map);
  }
  return map;
}

/**
 * Lists all active terminal sessions for a project. Automatically creates a default session if none exist.
 */
export function listTerminalSessions(projectId: string): TerminalTabInfo[] {
  const map = getProjectSessionsMap(projectId);

  if (map.size === 0) {
    // Create initial session
    const defaultShell = getAvailableShells()[0];
    createTerminalSession(projectId, defaultShell?.type || "powershell");
  }

  const result: TerminalTabInfo[] = [];
  for (const session of map.values()) {
    result.push({
      id: session.id,
      name: session.name,
      shellType: session.shellType,
      cwd: session.cwd,
      isRunning: Boolean(session.activeProcess && !session.activeProcess.child.killed),
    });
  }

  return result;
}

/**
 * Retrieves a specific terminal session.
 */
export function getTerminalSession(projectId: string, sessionId: string): TerminalSession | undefined {
  const map = getProjectSessionsMap(projectId);
  return map.get(sessionId);
}

let sessionCounter = 0;

/**
 * Creates a new terminal session tab.
 */
export function createTerminalSession(
  projectId: string,
  preferredShellType?: ShellType,
  customName?: string
): TerminalSession {
  const map = getProjectSessionsMap(projectId);
  const shells = getAvailableShells();

  let selectedShell = shells.find((s) => s.type === preferredShellType) || shells[0];

  sessionCounter += 1;
  const sessionId = `term_${Date.now()}_${sessionCounter}`;
  const sessionName = customName || `${map.size + 1}: ${selectedShell.type}`;

  const session: TerminalSession = {
    id: sessionId,
    name: sessionName,
    projectId,
    shellType: selectedShell.type,
    shellPath: selectedShell.path,
    cwd: "",
    history: [],
    recentBuffer: [
      `\x1b[38;2;130;80;223m[Antigravity Cloud IDE]\x1b[0m Terminal session #${map.size + 1} initialized (${selectedShell.label})\r\n`,
      `\x1b[90mWorkspace Root: ~/project\x1b[0m\r\n\r\n`,
    ],
    lastActive: Date.now(),
  };

  map.set(sessionId, session);
  return session;
}

/**
 * Renames an existing terminal session tab.
 */
export function renameTerminalSession(projectId: string, sessionId: string, newName: string): boolean {
  const session = getTerminalSession(projectId, sessionId);
  if (!session) return false;
  session.name = newName.trim() || session.name;
  return true;
}

/**
 * Closes and terminates a terminal session tab.
 */
export async function closeTerminalSession(projectId: string, sessionId: string): Promise<boolean> {
  const map = getProjectSessionsMap(projectId);
  const session = map.get(sessionId);
  if (!session) return false;

  if (session.activeProcess) {
    await killSessionProcess(projectId, sessionId);
  }

  map.delete(sessionId);
  return true;
}

/**
 * Cross-platform process tree termination for a session's foreground process.
 * On Windows, invokes taskkill /pid <pid> /T /F so child node/npm/vite processes are terminated cleanly.
 */
export async function killSessionProcess(projectId: string, sessionId: string): Promise<boolean> {
  const session = getTerminalSession(projectId, sessionId);
  if (!session || !session.activeProcess) return false;

  const { child, pid } = session.activeProcess;
  session.activeProcess = undefined;

  if (process.platform === "win32") {
    try {
      await new Promise<void>((resolve) => {
        exec(`taskkill /pid ${pid} /T /F`, (err) => {
          if (err) {
            try {
              child.kill("SIGKILL");
            } catch {}
          }
          resolve();
        });
      });
      return true;
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {}
      return true;
    }
  } else {
    try {
      try {
        process.kill(-pid, "SIGTERM");
      } catch {
        child.kill("SIGTERM");
      }

      setTimeout(() => {
        try {
          process.kill(-pid, "SIGKILL");
        } catch {
          try {
            child.kill("SIGKILL");
          } catch {}
        }
      }, 300);

      return true;
    } catch {
      try {
        child.kill();
      } catch {}
      return false;
    }
  }
}

/**
 * Sends input to the session's active foreground process (stdin).
 */
export function writeSessionStdin(projectId: string, sessionId: string, input: string): boolean {
  const session = getTerminalSession(projectId, sessionId);
  if (!session || !session.activeProcess || !session.activeProcess.child.stdin) {
    return false;
  }

  try {
    session.activeProcess.child.stdin.write(input);
    return true;
  } catch (err) {
    console.error(`Failed to write stdin to session ${sessionId}:`, err);
    return false;
  }
}

/**
 * Resolves a `cd` directory change safely inside the physical project sandbox.
 */
export function resolveSessionCd(
  projectId: string,
  sessionId: string,
  targetArg: string
): { success: boolean; newCwd: string; error?: string } {
  const session = getTerminalSession(projectId, sessionId);
  if (!session) {
    return { success: false, newCwd: "", error: "Session not found." };
  }

  const trimmed = targetArg.trim().replace(/^["']|["']$/g, "");

  if (!trimmed || trimmed === "~" || trimmed === "/") {
    session.cwd = "";
    return { success: true, newCwd: "" };
  }

  let nextRelative = path.posix.normalize(
    path.posix.join(session.cwd, trimmed.replace(/\\/g, "/"))
  );

  // Prevent escaping workspace root
  if (nextRelative.startsWith("../") || nextRelative === "..") {
    nextRelative = "";
  }

  try {
    const testPath = resolveSafePath(projectId, nextRelative);
    const stat = fs.statSync(testPath);
    if (!stat.isDirectory()) {
      return {
        success: false,
        newCwd: session.cwd,
        error: `cd: not a directory: ${trimmed}`,
      };
    }
    const finalCwd = nextRelative === "." ? "" : nextRelative;
    session.cwd = finalCwd;
    return { success: true, newCwd: finalCwd };
  } catch {
    return {
      success: false,
      newCwd: session.cwd,
      error: `cd: no such file or directory: ${trimmed}`,
    };
  }
}

/**
 * Executes a command in the session with live streaming, maintaining session state.
 */
export function executeCommandInSession(
  projectId: string,
  sessionId: string,
  rawCommand: string,
  onEvent: (event: StreamEvent) => void
): () => Promise<boolean> {
  const session = getTerminalSession(projectId, sessionId);
  if (!session) {
    onEvent({
      type: "error",
      data: `Session ${sessionId} not found.\r\n`,
      exitCode: 1,
    });
    return async () => false;
  }

  session.lastActive = Date.now();
  const command = rawCommand.trim();

  // Add to command history (avoiding immediate duplicate)
  if (command && (session.history.length === 0 || session.history[session.history.length - 1] !== command)) {
    session.history.push(command);
  }

  // 1. Handle Built-in `cd`
  if (command === "cd" || command === "cd ~" || command === "cd /") {
    session.cwd = "";
    onEvent({ type: "cwd", cwd: "" });
    onEvent({ type: "exit", exitCode: 0, cwd: "" });
    return async () => true;
  }

  if (command.startsWith("cd ")) {
    const target = command.slice(3).trim();
    const res = resolveSessionCd(projectId, sessionId, target);
    if (res.success) {
      onEvent({ type: "cwd", cwd: res.newCwd });
      onEvent({ type: "exit", exitCode: 0, cwd: res.newCwd });
    } else {
      onEvent({ type: "stderr", data: `${res.error}\r\n` });
      onEvent({ type: "exit", exitCode: 1, cwd: session.cwd });
    }
    return async () => true;
  }

  // 2. Handle Real Shell Execution
  const workspaceRoot = getWorkspaceDir(projectId);
  let effectiveDir = workspaceRoot;

  try {
    effectiveDir = session.cwd ? resolveSafePath(projectId, session.cwd) : workspaceRoot;
  } catch {
    effectiveDir = workspaceRoot;
  }

  const isWindows = process.platform === "win32";
  let shellExec = session.shellPath;
  let shellArgs: string[] = [];
  let sanitizedCommand = command;

  if (session.shellType === "powershell") {
    // Windows PowerShell 5.1 compatibility: polyfill `&&` chained operators
    if (sanitizedCommand.includes(" && ")) {
      const parts = sanitizedCommand.split(" && ");
      sanitizedCommand = parts[0] + parts.slice(1).map((p) => `; if ($?) { ${p} }`).join("");
    }
    // Explicitly enforce current working directory inside PowerShell
    const escapedDir = effectiveDir.replace(/'/g, "''");
    sanitizedCommand = `Set-Location '${escapedDir}'; ${sanitizedCommand}`;

    shellExec = session.shellPath || (process.env.SystemRoot ? path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe") : "powershell.exe");
    shellArgs = ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", sanitizedCommand];
  } else if (session.shellType === "cmd") {
    shellExec = process.env.ComSpec || "cmd.exe";
    shellArgs = ["/d", "/s", "/c", command];
  } else {
    // bash or sh
    shellExec = session.shellPath || "/bin/sh";
    shellArgs = ["-c", command];
  }

  const child = spawn(shellExec, shellArgs, {
    cwd: effectiveDir,
    windowsVerbatimArguments: isWindows,
    env: {
      ...process.env,
      PROJECT_ID: projectId,
      NODE_ENV: "development",
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      FORCE_COLOR: "1",
      NPM_CONFIG_COLOR: "always",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (child.pid) {
    session.activeProcess = {
      child,
      pid: child.pid,
      command,
      startedAt: Date.now(),
    };
  }

  // Buffer chunk helper
  const appendBuffer = (text: string) => {
    session.recentBuffer.push(text);
    if (session.recentBuffer.length > 500) {
      session.recentBuffer.splice(0, session.recentBuffer.length - 500);
    }
  };

  child.stdout?.on("data", (chunk: Buffer) => {
    const str = chunk.toString("utf-8");
    appendBuffer(str);
    onEvent({
      type: "stdout",
      data: str,
      sessionId,
    });
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    const str = chunk.toString("utf-8");
    appendBuffer(str);
    onEvent({
      type: "stderr",
      data: str,
      sessionId,
    });
  });

  child.on("error", (err: Error) => {
    session.activeProcess = undefined;
    const msg = `Process error: ${err.message}\r\n`;
    appendBuffer(msg);
    onEvent({
      type: "error",
      data: msg,
      exitCode: 1,
      sessionId,
    });
  });

  child.on("close", async (code: number | null) => {
    session.activeProcess = undefined;
    const exitCode = code !== null ? code : 0;

    // Check if command could have created, deleted, or modified files
    const isFsModifying = /(touch|mkdir|rm|echo|npm|npx|node|python|git|curl|wget|install|create|build|init|set-content|new-item|out-file|type)/i.test(command);
    let updatedFiles: ProjectFile[] | undefined = undefined;

    if (isFsModifying) {
      try {
        updatedFiles = await syncDiskToDatabase(projectId);
      } catch (syncErr) {
        console.error("Post-command sync error in session:", syncErr);
      }
    }

    onEvent({
      type: "exit",
      exitCode,
      cwd: session.cwd,
      sessionId,
      updatedFiles,
    });
  });

  return () => killSessionProcess(projectId, sessionId);
}
