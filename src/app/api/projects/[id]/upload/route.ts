import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

interface RouteProps {
  params: Promise<{ id: string }>;
}

function generateId(prefix: string = "f"): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "ico",
  "bmp",
  "avif",
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit

function sanitizePath(rawPath: string): string {
  // Normalize slashes and remove directory traversal attempts
  const cleaned = rawPath
    .replace(/\\/g, "/")
    .replace(/\0/g, "")
    .replace(/\/\.{2,}(?=\/|$)/g, "") // remove /.. or /...
    .replace(/^\/+/, "")
    .trim();

  // Disallow paths escaping project root
  if (cleaned.startsWith("../") || cleaned.includes("/../") || cleaned === "..") {
    throw new Error("Unsafe path traversal detected.");
  }

  return cleaned;
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
    const contentType = req.headers.get("content-type") || "";
    let incomingFiles: {
      name: string;
      path: string;
      content: string;
      mimeType?: string;
      size?: number;
    }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const folderPrefix = (formData.get("folder") as string) || "";
      const formFiles = formData.getAll("files") as File[];

      for (const file of formFiles) {
        if (!file || typeof file.arrayBuffer !== "function") continue;

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${file.name}" exceeds maximum allowed size of 15MB.` },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isSvg = ext === "svg" || file.type === "image/svg+xml";

        let content = "";
        if (isSvg) {
          content = buffer.toString("utf-8");
        } else {
          content = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
        }

        const targetPath = folderPrefix ? `${folderPrefix}/${file.name}` : file.name;
        incomingFiles.push({
          name: file.name,
          path: targetPath,
          content,
          mimeType: file.type || undefined,
          size: file.size,
        });
      }
    } else {
      const body = await req.json();
      if (Array.isArray(body.files)) {
        incomingFiles = body.files;
      } else if (body.name && body.content) {
        incomingFiles = [body];
      }
    }

    if (incomingFiles.length === 0) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const createdFiles: Array<{
      id: string;
      name: string;
      path: string;
      content: string;
      language: string;
      isFolder: boolean;
      parentId: string | null;
      version: number;
    }> = [];

    await prisma.$transaction(async (tx) => {
      // Fetch current files to map existing folders
      const existingProject = await tx.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });
      if (!existingProject) throw new Error("Project not found");

      const folderMap = new Map<string, string>();
      for (const f of existingProject.files) {
        if (f.isFolder) {
          folderMap.set(f.path, f.id);
        }
      }

      for (const file of incomingFiles) {
        const sanitized = sanitizePath(file.path);
        const fileName = sanitized.split("/").pop() || file.name;
        const ext = fileName.split(".").pop()?.toLowerCase() || "";

        // Check if extension is supported
        const isImage = ALLOWED_IMAGE_EXTENSIONS.has(ext);

        // Auto-create intermediate folders if necessary
        const parts = sanitized.split("/");
        let currentParentId: string | null = null;
        let runningPath = "";

        if (parts.length > 1) {
          for (let i = 0; i < parts.length - 1; i++) {
            const folderName = parts[i];
            runningPath = runningPath ? `${runningPath}/${folderName}` : folderName;

            if (folderMap.has(runningPath)) {
              currentParentId = folderMap.get(runningPath)!;
            } else {
              const newFolderId = generateId("f_dir");
              const createdFolder: { id: string } = await tx.projectFile.create({
                data: {
                  id: newFolderId,
                  projectId,
                  name: folderName,
                  path: runningPath,
                  content: "",
                  language: "",
                  isFolder: true,
                  parentId: currentParentId,
                  version: 1,
                },
              });
              folderMap.set(runningPath, createdFolder.id);
              currentParentId = createdFolder.id;
            }
          }
        }

        // Upsert or create file
        const existingFile = existingProject.files.find((f) => f.path === sanitized);
        if (existingFile) {
          const updated = await tx.projectFile.update({
            where: { id: existingFile.id },
            data: {
              content: file.content,
              language: isImage ? "image" : ext,
              version: existingFile.version + 1,
              updatedAt: new Date(),
            },
          });
          createdFiles.push(updated);
        } else {
          const newFile = await tx.projectFile.create({
            data: {
              id: generateId("f"),
              projectId,
              name: fileName,
              path: sanitized,
              content: file.content,
              language: isImage ? "image" : ext || "plaintext",
              isFolder: false,
              parentId: currentParentId,
              version: 1,
            },
          });
          createdFiles.push(newFile);
        }
      }

      await tx.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      });
    });

    return NextResponse.json({
      success: true,
      files: createdFiles,
      message: `Successfully uploaded ${createdFiles.length} file(s).`,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
