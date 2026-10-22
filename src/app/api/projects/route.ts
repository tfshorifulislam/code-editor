import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getUserProjects, createCloudProject } from "@/lib/server/projectService";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryParam = searchParams.get("category") || "all";
  const category = ["all", "recent", "starred", "trash"].includes(categoryParam)
    ? (categoryParam as "all" | "recent" | "starred" | "trash")
    : "all";

  try {
    const projects = await getUserProjects(user.id, category);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch cloud projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const project = await createCloudProject(user.id, body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Failed to create cloud project:", error);
    return NextResponse.json({ error: "Failed to create project." }, { status: 500 });
  }
}
