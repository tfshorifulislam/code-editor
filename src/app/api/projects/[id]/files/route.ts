import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createProjectFile } from "@/lib/server/projectService";

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
    const body = await req.json();
    const { name, isFolder, parentId, content } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "File name is required." }, { status: 400 });
    }

    const newFile = await createProjectFile(projectId, user.id, {
      name,
      isFolder: Boolean(isFolder),
      parentId: parentId || null,
      content,
    });

    if (!newFile) {
      return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ file: newFile }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create file.";
    console.error("Create file error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
