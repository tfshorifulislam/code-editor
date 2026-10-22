import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { syncDiskToDatabase, ensureWorkspaceOnDisk } from "@/lib/server/workspaceDisk";

interface RouteProps {
  params: Promise<{ id: string }>;
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

  try {
    // 1. Ensure disk is present
    await ensureWorkspaceOnDisk(project);

    // 2. Sync any files from disk back into database
    const files = await syncDiskToDatabase(projectId);

    return NextResponse.json({
      success: true,
      files,
      message: `Synchronized ${files.length} workspace files.`,
    });
  } catch (error: unknown) {
    console.error("Workspace sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync workspace." },
      { status: 500 }
    );
  }
}
