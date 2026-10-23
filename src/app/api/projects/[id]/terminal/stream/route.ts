import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { ensureWorkspaceOnDisk } from "@/lib/server/workspaceDisk";
import {
  spawnCommandStream,
  resolveCd,
  getSessionCwd,
  setSessionCwd,
  StreamEvent,
} from "@/lib/server/terminalProcessManager";
import {
  executeCommandInSession,
  getTerminalSession,
} from "@/lib/server/terminalSessionManager";

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
  const rawCommand = (body.command as string || "").trim();
  const sessionId = body.sessionId as string | undefined;

  if (!rawCommand) {
    return new Response(JSON.stringify({ error: "Command is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  // If a multi-tab session is targeted, use executeCommandInSession
  if (sessionId && getTerminalSession(projectId, sessionId)) {
    let cancelFn: (() => Promise<boolean>) | null = null;

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

        cancelFn = executeCommandInSession(projectId, sessionId, rawCommand, (event) => {
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
        if (cancelFn) cancelFn().catch(() => {});
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

  const requestedCwd = typeof body.cwd === "string" ? body.cwd : getSessionCwd(projectId);

  // Handle `cd` directly and safely
  if (rawCommand === "cd" || rawCommand === "cd ~" || rawCommand === "cd /") {
    setSessionCwd(projectId, "");
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "cwd", cwd: "" })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "exit", exitCode: 0, cwd: "" })}\n\n`)
        );
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
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "cwd", cwd: cdResult.newCwd })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "exit", exitCode: 0, cwd: cdResult.newCwd })}\n\n`
            )
          );
        } else {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "stderr",
                data: `${cdResult.error}\n`,
              })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "exit",
                exitCode: 1,
                cwd: requestedCwd,
              })}\n\n`
            )
          );
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

  // Handle real shell command streaming
  const effectiveCwd = requestedCwd || getSessionCwd(projectId);
  let killProcess: (() => Promise<boolean>) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      const safeEnqueue = (event: StreamEvent) => {
        if (isClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          isClosed = true;
        }
      };

      killProcess = spawnCommandStream(
        projectId,
        rawCommand,
        effectiveCwd,
        (event) => {
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
        }
      );
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

