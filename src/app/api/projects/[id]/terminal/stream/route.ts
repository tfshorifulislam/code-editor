import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { ensureWorkspaceOnDisk } from "@/lib/server/workspaceDisk";
import {
  spawnCommandStream,
  resolveCd,
  getSessionCwd,
  setSessionCwd,
} from "@/lib/server/terminalProcessManager";
import {
  getPtySession,
  createPtySession,
  writePtySession,
  PtySession,
} from "@/lib/server/terminalPtyManager";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: projectId } = await params;
  const project = await getProjectById(projectId, user.id);
  if (!project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ensure workspace directory exists
  await ensureWorkspaceOnDisk(project);

  const body = await req.json().catch(() => ({}));
  const rawCommand = typeof body.command === "string" ? body.command.trim() : "";
  const sessionId = body.sessionId as string | undefined;

  const encoder = new TextEncoder();

  // If targeting a persistent PTY session:
  if (sessionId) {
    let session = getPtySession(projectId, sessionId);
    if (!session) {
      session = createPtySession(projectId);
    }

    const currentSession: PtySession = session;

    // If a command was supplied to run, write it to the PTY
    if (rawCommand) {
      writePtySession(projectId, currentSession.id, rawCommand.endsWith("\r\n") ? rawCommand : rawCommand + "\r\n");
    }

    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;

        // Replay existing buffer first
        if (currentSession.outputBuffer.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "output",
                data: currentSession.outputBuffer.join(""),
              })}\n\n`
            )
          );
        }

        const onData = (chunk: string) => {
          if (isClosed) return;
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "output", data: chunk })}\n\n`)
            );
          } catch {
            isClosed = true;
          }
        };

        const onSync = (updatedFiles: unknown) => {
          if (isClosed) return;
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "sync", updatedFiles })}\n\n`)
            );
          } catch {
            isClosed = true;
          }
        };

        currentSession.listeners.add(onData);
        currentSession.syncListeners.add(onSync);

        // Keep connection open until client closes
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Fallback for NewProjectDialog (transient session execution)
  const requestedCwd = typeof body.cwd === "string" ? body.cwd : getSessionCwd(projectId);

  if (!rawCommand) {
    return new Response(JSON.stringify({ error: "Command is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle cd in transient session
  if (rawCommand === "cd" || rawCommand === "cd ~" || rawCommand === "cd /") {
    setSessionCwd(projectId, "");
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "cwd", cwd: "" })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "exit", exitCode: 0, cwd: "" })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  if (rawCommand.startsWith("cd ")) {
    const targetArg = rawCommand.slice(3).trim();
    const cdResult = await resolveCd(projectId, targetArg, requestedCwd);

    const stream = new ReadableStream({
      start(controller) {
        if (cdResult.success) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "cwd", cwd: cdResult.newCwd })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "exit", exitCode: 0, cwd: cdResult.newCwd })}\n\n`));
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "stderr", data: `${cdResult.error}\n` })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "exit", exitCode: 1, cwd: requestedCwd })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const effectiveCwd = requestedCwd || getSessionCwd(projectId);
  let killProcess: (() => Promise<boolean>) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      const safeEnqueue = (event: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          isClosed = true;
        }
      };

      killProcess = spawnCommandStream(projectId, rawCommand, effectiveCwd, (event) => {
        if (event.type === "exit" || event.type === "error") {
          safeEnqueue(event);
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {}
          }
        } else {
          safeEnqueue(event);
        }
      });
    },
    cancel() {
      if (killProcess) {
        killProcess().catch(() => {});
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
