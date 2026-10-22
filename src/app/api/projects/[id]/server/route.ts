import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import {
  getDevServerStatus,
  startDevServer,
  stopDevServer,
  restartDevServer,
} from "@/lib/server/devServerManager";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export const maxDuration = 30;

export async function GET(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id: projectId } = await params;
  const project = await getProjectById(projectId, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
  }

  const status = getDevServerStatus(projectId);
  return NextResponse.json({ server: status });
}

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

  const body = await req.json().catch(() => ({}));
  const action = (body.action as string) || "start";

  try {
    if (action === "stop") {
      await stopDevServer(projectId);
      return NextResponse.json({
        server: { status: "stopped", logs: ["[DevServer] Stopped by user."] },
      });
    }

    if (action === "restart") {
      const restarted = await restartDevServer(projectId);
      return NextResponse.json({
        server: {
          status: restarted.status,
          port: restarted.port,
          url: restarted.url,
          framework: restarted.framework,
          logs: restarted.logs,
          error: restarted.error,
        },
      });
    }

    // Default: start
    const instance = await startDevServer(projectId);
    return NextResponse.json({
      server: {
        status: instance.status,
        port: instance.port,
        url: instance.url,
        framework: instance.framework,
        logs: instance.logs,
        error: instance.error,
      },
    });
  } catch (err) {
    console.error("Dev server action error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to execute dev server action.",
      },
      { status: 500 }
    );
  }
}

