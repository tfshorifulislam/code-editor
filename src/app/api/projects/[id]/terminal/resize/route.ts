import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { resizePtySession } from "@/lib/server/terminalPtyManager";

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
  const sessionId = body.sessionId as string;
  const cols = typeof body.cols === "number" ? body.cols : 80;
  const rows = typeof body.rows === "number" ? body.rows : 24;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const resized = resizePtySession(projectId, sessionId, cols, rows);

  return NextResponse.json({ success: resized });
}

