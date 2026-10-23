import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import {
  listTerminalSessions,
  createTerminalSession,
  renameTerminalSession,
  closeTerminalSession,
  getAvailableShells,
} from "@/lib/server/terminalSessionManager";
import { getOrCreateTerminalWSServer, getTerminalWSPort } from "@/lib/server/terminalWebSocketServer";
import { ShellType } from "@/types/editor";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const project = await getProjectById(projectId, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Ensure WebSocket server is spun up
  try {
    getOrCreateTerminalWSServer();
  } catch (err) {
    console.warn("WebSocket server start error:", err);
  }

  const sessions = listTerminalSessions(projectId);
  const availableShells = getAvailableShells();
  const wsPort = getTerminalWSPort();

  return NextResponse.json({
    sessions,
    availableShells,
    wsPort,
  });
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
  const shellType = body.shellType as ShellType | undefined;
  const name = typeof body.name === "string" ? body.name : undefined;

  const session = createTerminalSession(projectId, shellType, name);

  return NextResponse.json({
    session: {
      id: session.id,
      name: session.name,
      shellType: session.shellType,
      cwd: session.cwd,
    },
  });
}

export async function PATCH(req: Request, { params }: RouteProps) {
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
  const newName = body.name as string;

  if (!sessionId || !newName) {
    return NextResponse.json({ error: "Missing sessionId or name" }, { status: 400 });
  }

  const renamed = renameTerminalSession(projectId, sessionId, newName);

  return NextResponse.json({ success: renamed });
}

export async function DELETE(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const project = await getProjectById(projectId, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const closed = await closeTerminalSession(projectId, sessionId);

  return NextResponse.json({ success: closed });
}

