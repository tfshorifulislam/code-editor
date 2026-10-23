import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { writeStdin, isProcessRunning } from "@/lib/server/terminalProcessManager";
import { writePtySession } from "@/lib/server/terminalPtyManager";

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
  const input = typeof body.input === "string" ? body.input : "";
  const sessionId = body.sessionId as string | undefined;

  if (sessionId) {
    const sent = writePtySession(projectId, sessionId, input);
    return NextResponse.json({ success: sent });
  }

  if (!isProcessRunning(projectId)) {
    return NextResponse.json(
      { error: "No active process accepting stdin." },
      { status: 400 }
    );
  }

  const sent = writeStdin(projectId, input);

  return NextResponse.json({
    success: sent,
  });
}
