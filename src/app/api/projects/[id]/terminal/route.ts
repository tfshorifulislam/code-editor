import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import {
  ensureWorkspaceOnDisk,
  resolveSafePath,
  syncDiskToDatabase,
} from "@/lib/server/workspaceDisk";
import { exec } from "child_process";
import fsp from "fs/promises";
import path from "path";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export const maxDuration = 30; // 30s timeout

export async function POST(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id: projectId } = await params;
  const project = await getProjectById(projectId, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
  }

  // Ensure workspace directory on disk exists
  const workspaceDir = await ensureWorkspaceOnDisk(project);

  const body = await req.json().catch(() => ({}));
  const rawCommand = (body.command as string || "").trim();
  const currentRelativeCwd = (body.cwd as string || "").replace(/\\/g, "/").replace(/^\/+/, "");

  if (!rawCommand) {
    return NextResponse.json({ stdout: "", stderr: "", exitCode: 0, cwd: currentRelativeCwd });
  }

  // Compute current working directory
  let effectiveDir = workspaceDir;
  if (currentRelativeCwd) {
    try {
      effectiveDir = resolveSafePath(projectId, currentRelativeCwd);
    } catch {
      effectiveDir = workspaceDir;
    }
  }

  // 1. Handle Navigation (`cd`) directly and safely
  if (rawCommand === "cd" || rawCommand === "cd ~" || rawCommand === "cd /") {
    return NextResponse.json({ stdout: "", stderr: "", exitCode: 0, cwd: "" });
  }

  if (rawCommand.startsWith("cd ")) {
    const targetArg = rawCommand.slice(3).trim().replace(/^["']|["']$/g, "");

    if (!targetArg || targetArg === "~" || targetArg === "/") {
      return NextResponse.json({ stdout: "", stderr: "", exitCode: 0, cwd: "" });
    }

    let nextRelative = path.posix.normalize(
      path.posix.join(currentRelativeCwd, targetArg.replace(/\\/g, "/"))
    );

    // Prevent escaping root
    if (nextRelative.startsWith("../") || nextRelative === "..") {
      nextRelative = "";
    }

    const testPath = resolveSafePath(projectId, nextRelative);
    try {
      const stat = await fsp.stat(testPath);
      if (!stat.isDirectory()) {
        return NextResponse.json({
          stdout: "",
          stderr: `cd: not a directory: ${targetArg}\n`,
          exitCode: 1,
          cwd: currentRelativeCwd,
        });
      }
      return NextResponse.json({
        stdout: "",
        stderr: "",
        exitCode: 0,
        cwd: nextRelative === "." ? "" : nextRelative,
      });
    } catch {
      return NextResponse.json({
        stdout: "",
        stderr: `cd: no such file or directory: ${targetArg}\n`,
        exitCode: 1,
        cwd: currentRelativeCwd,
      });
    }
  }

  // 2. Handle `pwd`
  if (rawCommand === "pwd") {
    const displayPath = currentRelativeCwd ? `~/project/${currentRelativeCwd}` : "~/project";
    return NextResponse.json({
      stdout: `${displayPath}\n`,
      stderr: "",
      exitCode: 0,
      cwd: currentRelativeCwd,
    });
  }

  // 3. Handle `whoami`
  if (rawCommand === "whoami") {
    return NextResponse.json({
      stdout: `${user.email}\n`,
      stderr: "",
      exitCode: 0,
      cwd: currentRelativeCwd,
    });
  }

  // 4. Handle Fast Native File Operations (instant, secure, cross-platform)
  if (rawCommand.startsWith("touch ")) {
    const fileName = rawCommand.slice(6).trim().replace(/^["']|["']$/g, "");
    if (fileName) {
      try {
        const filePath = resolveSafePath(projectId, path.posix.join(currentRelativeCwd, fileName));
        await fsp.mkdir(path.dirname(filePath), { recursive: true });
        try {
          await fsp.appendFile(filePath, "");
        } catch {
          await fsp.writeFile(filePath, "");
        }
        const updatedFiles = await syncDiskToDatabase(projectId);
        return NextResponse.json({
          stdout: "",
          stderr: "",
          exitCode: 0,
          cwd: currentRelativeCwd,
          updatedFiles,
        });
      } catch (err) {
        return NextResponse.json({
          stdout: "",
          stderr: `touch: ${err instanceof Error ? err.message : String(err)}\n`,
          exitCode: 1,
          cwd: currentRelativeCwd,
        });
      }
    }
  }

  if (rawCommand.startsWith("mkdir ")) {
    const dirName = rawCommand.slice(6).trim().replace(/^-p\s+/i, "").replace(/^["']|["']$/g, "");
    if (dirName) {
      try {
        const dirPath = resolveSafePath(projectId, path.posix.join(currentRelativeCwd, dirName));
        await fsp.mkdir(dirPath, { recursive: true });
        const updatedFiles = await syncDiskToDatabase(projectId);
        return NextResponse.json({
          stdout: "",
          stderr: "",
          exitCode: 0,
          cwd: currentRelativeCwd,
          updatedFiles,
        });
      } catch (err) {
        return NextResponse.json({
          stdout: "",
          stderr: `mkdir: ${err instanceof Error ? err.message : String(err)}\n`,
          exitCode: 1,
          cwd: currentRelativeCwd,
        });
      }
    }
  }

  if (rawCommand.startsWith("rm ")) {
    const isRecursive = /-[rRfF]+/i.test(rawCommand);
    const target = rawCommand.replace(/^rm\s+(-[rRfF]+\s+)?/i, "").trim().replace(/^["']|["']$/g, "");
    if (target) {
      try {
        const targetPath = resolveSafePath(projectId, path.posix.join(currentRelativeCwd, target));
        await fsp.rm(targetPath, { recursive: isRecursive, force: true });
        const updatedFiles = await syncDiskToDatabase(projectId);
        return NextResponse.json({
          stdout: "",
          stderr: "",
          exitCode: 0,
          cwd: currentRelativeCwd,
          updatedFiles,
        });
      } catch (err) {
        return NextResponse.json({
          stdout: "",
          stderr: `rm: ${err instanceof Error ? err.message : String(err)}\n`,
          exitCode: 1,
          cwd: currentRelativeCwd,
        });
      }
    }
  }

  if (rawCommand.startsWith("cat ")) {
    const fileName = rawCommand.slice(4).trim().replace(/^["']|["']$/g, "");
    if (fileName) {
      try {
        const filePath = resolveSafePath(projectId, path.posix.join(currentRelativeCwd, fileName));
        const content = await fsp.readFile(filePath, "utf-8");
        return NextResponse.json({
          stdout: content.endsWith("\n") ? content : content + "\n",
          stderr: "",
          exitCode: 0,
          cwd: currentRelativeCwd,
        });
      } catch {
        return NextResponse.json({
          stdout: "",
          stderr: `cat: ${fileName}: No such file or directory\n`,
          exitCode: 1,
          cwd: currentRelativeCwd,
        });
      }
    }
  }

  if (rawCommand === "ls" || rawCommand.startsWith("ls ")) {
    const arg = rawCommand.slice(2).trim();
    const targetDir = arg
      ? resolveSafePath(projectId, path.posix.join(currentRelativeCwd, arg))
      : effectiveDir;
    try {
      const entries = await fsp.readdir(targetDir, { withFileTypes: true });
      const lines = entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
      return NextResponse.json({
        stdout: lines.length > 0 ? lines.join("  ") + "\n" : "",
        stderr: "",
        exitCode: 0,
        cwd: currentRelativeCwd,
      });
    } catch {
      return NextResponse.json({
        stdout: "",
        stderr: `ls: cannot access '${arg}': No such file or directory\n`,
        exitCode: 1,
        cwd: currentRelativeCwd,
      });
    }
  }

  // 5. Execute Real Shell Command for arbitrary system processes
  const isWindows = process.platform === "win32";

  return new Promise<Response>((resolve) => {
    exec(
      rawCommand,
      {
        cwd: effectiveDir,
        shell: isWindows ? "powershell.exe" : "/bin/sh",
        env: {
          ...process.env,
          PROJECT_ID: projectId,
          NODE_ENV: "development",
        },
        timeout: 25000,
        maxBuffer: 1024 * 1024 * 5, // 5MB buffer
      },
      async (error, stdout, stderr) => {
        const exitCode = error ? (error.code ?? 1) : 0;

        // Check if command could have modified filesystem
        const isFsModifying = /(echo|npm|npx|node|python|git|curl|wget)/i.test(rawCommand);
        let updatedFiles = undefined;

        if (isFsModifying) {
          try {
            updatedFiles = await syncDiskToDatabase(projectId);
          } catch (syncErr) {
            console.error("Post-command sync error:", syncErr);
          }
        }

        resolve(
          NextResponse.json({
            stdout: stdout || "",
            stderr: stderr || (error && !stderr ? error.message + "\n" : ""),
            exitCode,
            cwd: currentRelativeCwd,
            updatedFiles,
          })
        );
      }
    );
  });
}
