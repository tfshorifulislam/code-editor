import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { duplicateProject } from "@/lib/server/projectService";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const duplicated = await duplicateProject(id, user.id);
    if (!duplicated) {
      return NextResponse.json({ error: "Source project not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ project: duplicated }, { status: 201 });
  } catch (error) {
    console.error("Failed to duplicate project:", error);
    return NextResponse.json({ error: "Failed to duplicate project." }, { status: 500 });
  }
}
