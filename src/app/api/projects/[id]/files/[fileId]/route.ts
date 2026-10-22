import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  updateProjectFileContent,
  renameProjectFile,
  deleteProjectFile,
} from "@/lib/server/projectService";

interface RouteProps {
  params: Promise<{ id: string; fileId: string }>;
}

export async function PATCH(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id: projectId, fileId } = await params;
  try {
    const body = await req.json();
    const { content, version } = body;

    if (content === undefined || typeof content !== "string") {
      return NextResponse.json({ error: "Content must be a string." }, { status: 400 });
    }

    const result = await updateProjectFileContent(
      projectId,
      fileId,
      user.id,
      content,
      version
    );

    if (result.status !== 200) {
      return NextResponse.json(result, { status: result.status });
    }

    return NextResponse.json({ file: result.file });
  } catch (error) {
    console.error("Save file error:", error);
    return NextResponse.json({ error: "Failed to save file." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id: projectId, fileId } = await params;
  try {
    const body = await req.json();
    const { newName } = body;

    if (!newName || typeof newName !== "string") {
      return NextResponse.json({ error: "New name is required." }, { status: 400 });
    }

    const updated = await renameProjectFile(projectId, fileId, user.id, newName);
    if (!updated) {
      return NextResponse.json({ error: "File not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ file: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to rename file.";
    console.error("Rename file error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id: projectId, fileId } = await params;
  try {
    const result = await deleteProjectFile(projectId, fileId, user.id);
    if (!result) {
      return NextResponse.json({ error: "File not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json({ error: "Failed to delete file." }, { status: 500 });
  }
}
