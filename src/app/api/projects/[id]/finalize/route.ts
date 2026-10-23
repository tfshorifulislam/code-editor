import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import {
  detectProjectsInWorkspace,
  promoteSubfolderToRoot,
} from "@/lib/server/projectDetector";
import { syncDiskToDatabase } from "@/lib/server/workspaceDisk";
import prisma from "@/lib/db/prisma";

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
  const customName = typeof body.name === "string" ? body.name.trim() : "";
  const subfolder = typeof body.subfolder === "string" ? body.subfolder.trim() : "";

  try {
    // 1. If project was generated in a subfolder (e.g. `npx create-next-app my-app`), promote to root
    if (subfolder && subfolder !== "." && subfolder !== "/") {
      await promoteSubfolderToRoot(projectId, subfolder);
    }

    // 2. Detect project structure
    const detectedList = await detectProjectsInWorkspace(projectId);
    const primary = detectedList[0];

    const detectedTemplate = primary?.template || "blank";
    const detectedName = customName || primary?.name || project.name;
    const entryFileRelPath = primary?.entryFile;

    // 3. Synchronize all disk files to SQLite database
    const syncedFiles = await syncDiskToDatabase(projectId);

    // 4. Find active file ID for the entry file if available
    let activeFileId: string | null = null;
    let openFileIds: string[] = [];

    if (entryFileRelPath) {
      const match = syncedFiles.find(
        (f) => !f.isFolder && (f.path === entryFileRelPath || f.path.endsWith("/" + entryFileRelPath))
      );
      if (match) {
        activeFileId = match.id;
        openFileIds = [match.id];
      }
    }

    if (!activeFileId && syncedFiles.length > 0) {
      const firstCodeFile = syncedFiles.find(
        (f) => !f.isFolder && !f.path.includes("node_modules") && !f.path.startsWith(".")
      );
      if (firstCodeFile) {
        activeFileId = firstCodeFile.id;
        openFileIds = [firstCodeFile.id];
      }
    }

    // 5. Update Project record in Prisma
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: detectedName,
        template: detectedTemplate,
        activeFileId: activeFileId || undefined,
        openFileIds: JSON.stringify(openFileIds),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      projectId,
      name: detectedName,
      template: detectedTemplate,
      fileCount: syncedFiles.length,
      redirectUrl: `/editor/${projectId}`,
    });
  } catch (error) {
    console.error("Project finalization error:", error);
    return NextResponse.json(
      { error: "Failed to finalize project setup." },
      { status: 500 }
    );
  }
}

