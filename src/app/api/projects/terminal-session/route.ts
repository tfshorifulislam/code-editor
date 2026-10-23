import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createCloudProject } from "@/lib/server/projectService";
import { ensureWorkspaceOnDisk } from "@/lib/server/workspaceDisk";
import { setSessionCwd } from "@/lib/server/terminalProcessManager";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawName = (body.name as string || "").trim();
    const projectName = rawName || "cloud-project";

    // Create a real blank project in Prisma
    const project = await createCloudProject(user.id, {
      type: "blank",
      blankSubtype: "empty",
      name: projectName,
      isPrivate: true,
    });

    if (!project) {
      throw new Error("Failed to create draft project.");
    }

    // Ensure the physical workspace directory exists on disk
    const workspaceDir = await ensureWorkspaceOnDisk(project);

    // Reset session working directory to workspace root
    setSessionCwd(project.id, "");

    return NextResponse.json(
      {
        projectId: project.id,
        name: project.name,
        cwd: "",
        workspaceDir,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to initialize terminal session:", error);
    return NextResponse.json(
      { error: "Failed to initialize terminal session." },
      { status: 500 }
    );
  }
}
