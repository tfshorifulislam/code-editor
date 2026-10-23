import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { detectProjectsInWorkspace } from "@/lib/server/projectDetector";

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

  try {
    const detected = await detectProjectsInWorkspace(projectId);
    return NextResponse.json({ detected });
  } catch (error) {
    console.error("Project detection error:", error);
    return NextResponse.json(
      { error: "Failed to detect project workspace." },
      { status: 500 }
    );
  }
}

