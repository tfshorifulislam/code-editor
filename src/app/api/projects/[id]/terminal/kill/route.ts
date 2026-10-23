import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { killSessionProcess, isProcessRunning } from "@/lib/server/terminalProcessManager";
import { killSessionProcess as killMultiSessionProcess } from "@/lib/server/terminalSessionManager";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const project = await getProjectById(projectId, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const sessionId = body.sessionId as string | undefined;

  if (sessionId) {
    const killed = await killMultiSessionProcess(projectId, sessionId);
    return NextResponse.json({ success: true, killed });
  }

  const wasRunning = isProcessRunning(projectId);
  const killed = await killSessionProcess(projectId);

  return NextResponse.json({
    success: true,
    wasRunning,
    killed,
  });
}

