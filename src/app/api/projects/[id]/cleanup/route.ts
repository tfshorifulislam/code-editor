import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById, deleteProject } from "@/lib/server/projectService";
import { killSessionProcess } from "@/lib/server/terminalProcessManager";
import { getWorkspaceDir } from "@/lib/server/workspaceDisk";
import fsp from "fs/promises";

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
    return NextResponse.json({ success: true });
  }

  // 1. Terminate any running process
  await killSessionProcess(projectId);

  // 2. Remove workspace disk folder
  try {
    const dir = getWorkspaceDir(projectId);
    await fsp.rm(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn("Failed to remove workspace folder during cleanup:", err);
  }

  // 3. Permanently delete the draft project from database
  try {
    await deleteProject(projectId, user.id, true);
  } catch (err) {
    console.warn("Failed to delete draft project during cleanup:", err);
  }

  return NextResponse.json({ success: true });
}

