import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById, updateProjectMetadata, deleteProject } from "@/lib/server/projectService";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const project = await getProjectById(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to get project:", error);
    return NextResponse.json({ error: "Failed to load project." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await updateProjectMetadata(id, user.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("Failed to update project metadata:", error);
    return NextResponse.json({ error: "Failed to update project." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  try {
    const result = await deleteProject(id, user.id, permanent);
    if (!result) {
      return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ success: true, permanent });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Failed to delete project." }, { status: 500 });
  }
}
