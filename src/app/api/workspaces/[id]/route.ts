import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { workspaceManager } from "@/lib/server/workspaceManager";

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
    return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
  }

  const workspace = await workspaceManager.getOrCreateWorkspace({
    projectId: project.id,
    userId: user.id,
    template: project.template,
  });

  return NextResponse.json({
    workspace,
    hasDocker: await workspaceManager.isDockerDaemonAvailable(),
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
    return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || "start";

  if (action === "stop") {
    await workspaceManager.stopWorkspace(projectId);
    return NextResponse.json({ success: true, status: "stopped" });
  }

  const workspace = await workspaceManager.restartWorkspace({
    projectId: project.id,
    userId: user.id,
    template: project.template,
  });

  return NextResponse.json({ workspace });
}

