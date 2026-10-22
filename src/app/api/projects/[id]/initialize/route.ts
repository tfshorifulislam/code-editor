import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { initializeFrameworkOnProject } from "@/lib/server/projectService";
import { FrameworkInitOptions } from "@/types/editor";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id: projectId } = await params;
  try {
    const body: FrameworkInitOptions = await req.json();

    if (!body || !body.type) {
      return NextResponse.json({ error: "Initialization type is required." }, { status: 400 });
    }

    const updatedProject = await initializeFrameworkOnProject(projectId, user.id, body);
    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ project: updatedProject, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initialize framework.";
    console.error("Initialize framework error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

