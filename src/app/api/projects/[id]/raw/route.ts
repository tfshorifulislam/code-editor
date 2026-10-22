import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/server/projectService";
import { getSessionUser } from "@/lib/auth/session";

interface RouteProps {
  params: Promise<{ id: string }>;
}

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  bmp: "image/bmp",
  avif: "image/avif",
  json: "application/json",
  css: "text/css",
  js: "text/javascript",
  ts: "text/plain",
  tsx: "text/plain",
  html: "text/html",
  md: "text/markdown",
  txt: "text/plain",
};

export async function GET(req: Request, { params }: RouteProps) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);

  const rawPath = searchParams.get("path");
  const fileId = searchParams.get("fileId");

  if (!rawPath && !fileId) {
    return NextResponse.json({ error: "Missing 'path' or 'fileId' query parameter." }, { status: 400 });
  }

  // Authorization check
  const user = await getSessionUser();
  const userId = user ? user.id : "";
  const project = await getProjectById(projectId, userId);

  if (!project) {
    return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
  }

  // Normalize path
  const normalizedPath = rawPath ? rawPath.replace(/^\/+/, "").replace(/\\/g, "/") : "";

  const file = project.files.find(
    (f) =>
      (!f.isFolder && fileId && f.id === fileId) ||
      (!f.isFolder && normalizedPath && f.path.replace(/^\/+/, "") === normalizedPath)
  );

  if (!file) {
    return NextResponse.json({ error: `File not found: ${rawPath || fileId}` }, { status: 404 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_MAP[ext] || "application/octet-stream";

  // Check if content is base64 data URI
  if (file.content.startsWith("data:") && file.content.includes(";base64,")) {
    const commaIndex = file.content.indexOf(",");
    const base64Data = file.content.slice(commaIndex + 1);
    const buffer = Buffer.from(base64Data, "base64");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600, immutable",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      },
    });
  }

  // Text / SVG or UTF-8 files
  return new Response(file.content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
    },
  });
}

