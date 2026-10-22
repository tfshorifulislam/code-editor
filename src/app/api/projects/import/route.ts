import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import JSZip from "jszip";
import crypto from "crypto";
import { detectProjectFramework } from "@/lib/project/detectFramework";

export const maxDuration = 60; // Allow sufficient time for larger archives

function generateId(prefix: string = "f"): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

const IGNORED_PREFIXES = [
  "node_modules/",
  ".git/",
  ".next/",
  "dist/",
  "build/",
  ".turbo/",
  "__pycache__/",
  ".venv/",
  "venv/",
  ".idea/",
  ".vscode/",
];

const IGNORED_FILES = new Set([
  ".ds_store",
  "thumbs.db",
  "desktop.ini",
  ".npmrc",
  "yarn-error.log",
  "package-lock.json.bak",
]);

const IMAGE_EXTENSIONS = new Set([
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

function getMimeType(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "ico":
      return "image/x-icon";
    case "bmp":
      return "image/bmp";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}

function sanitizePath(raw: string): string {
  const normalized = raw
    .replace(/\\/g, "/")
    .replace(/\0/g, "")
    .replace(/^\/+/, "")
    .trim();

  // ZIP Slip check
  if (
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    normalized === ".." ||
    normalized.includes("/./")
  ) {
    throw new Error(`Unsafe path traversal detected in file path: "${raw}"`);
  }

  return normalized;
}

function isIgnored(path: string): boolean {
  const lower = path.toLowerCase();
  const fileName = lower.split("/").pop() || "";
  if (IGNORED_FILES.has(fileName)) return true;
  return IGNORED_PREFIXES.some((prefix) => lower.startsWith(prefix) || lower.includes(`/${prefix}`));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let projectName = "";
    let projectDescription = "";
    const extractedFiles: {
      name: string;
      path: string;
      content: string;
      isFolder: boolean;
      language?: string;
    }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      projectName = (formData.get("name") as string) || "";
      projectDescription = (formData.get("description") as string) || "";

      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No archive or file uploaded." }, { status: 400 });
      }

      if (!projectName) {
        projectName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const zip = await JSZip.loadAsync(buffer);

      // Check ZIP entries
      const entries = Object.keys(zip.files);
      if (entries.length === 0) {
        return NextResponse.json({ error: "The uploaded ZIP archive is empty." }, { status: 400 });
      }

      if (entries.length > 2500) {
        return NextResponse.json(
          { error: `Archive contains ${entries.length} files. Maximum allowed is 2,500.` },
          { status: 400 }
        );
      }

      for (const [rawPath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue; // folders handled dynamically from paths

        const sanitized = sanitizePath(rawPath);
        if (!sanitized || isIgnored(sanitized)) continue;

        const fileName = sanitized.split("/").pop() || "";
        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        const isImage = IMAGE_EXTENSIONS.has(ext);

        let content = "";
        if (isImage && ext !== "svg") {
          const entryBuffer = await zipEntry.async("nodebuffer");
          const mime = getMimeType(ext);
          content = `data:${mime};base64,${entryBuffer.toString("base64")}`;
        } else {
          // Text file or SVG
          content = await zipEntry.async("string");
        }

        extractedFiles.push({
          name: fileName,
          path: sanitized,
          content,
          isFolder: false,
          language: isImage ? "image" : ext || "plaintext",
        });
      }
    } else {
      // JSON payload (e.g. from Directory Picker)
      const body = await req.json();
      projectName = body.name || "Imported Project";
      projectDescription = body.description || "";

      if (!Array.isArray(body.files) || body.files.length === 0) {
        return NextResponse.json({ error: "No files provided in import payload." }, { status: 400 });
      }

      for (const f of body.files) {
        const sanitized = sanitizePath(f.path);
        if (!sanitized || isIgnored(sanitized)) continue;

        const fileName = sanitized.split("/").pop() || f.name;
        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        const isImage = IMAGE_EXTENSIONS.has(ext);

        extractedFiles.push({
          name: fileName,
          path: sanitized,
          content: f.content || "",
          isFolder: Boolean(f.isFolder),
          language: isImage ? "image" : ext || "plaintext",
        });
      }
    }

    if (extractedFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid files found to import (ignored files/dependencies may have been filtered)." },
        { status: 400 }
      );
    }

    // Auto-detect framework
    const detection = detectProjectFramework(extractedFiles);
    const chosenTemplate = detection.template;

    // Check if package.json has a name
    const pkg = extractedFiles.find((f) => f.path === "package.json");
    if (pkg && !projectName) {
      try {
        const parsed = JSON.parse(pkg.content);
        if (parsed.name) projectName = parsed.name;
      } catch {
        // ignore
      }
    }

    if (!projectName.trim()) {
      projectName = "Imported Project";
    }

    // Prepare folder hierarchy map
    const folderMap = new Map<string, string>(); // path -> id
    const fileRecordsToCreate: {
      id: string;
      name: string;
      path: string;
      content: string;
      language: string;
      isFolder: boolean;
      parentId: string | null;
      version: number;
    }[] = [];

    // First collect all folders required
    for (const file of extractedFiles) {
      const parts = file.path.split("/");
      if (parts.length > 1) {
        let running = "";
        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          const prev = running;
          running = running ? `${running}/${folderName}` : folderName;

          if (!folderMap.has(running)) {
            const folderId = generateId("dir");
            folderMap.set(running, folderId);
            fileRecordsToCreate.push({
              id: folderId,
              name: folderName,
              path: running,
              content: "",
              language: "",
              isFolder: true,
              parentId: prev ? folderMap.get(prev) || null : null,
              version: 1,
            });
          }
        }
      }
    }

    // Next add actual files
    for (const file of extractedFiles) {
      const parts = file.path.split("/");
      let parentId: string | null = null;
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join("/");
        parentId = folderMap.get(parentPath) || null;
      }

      fileRecordsToCreate.push({
        id: generateId("f"),
        name: file.name,
        path: file.path,
        content: file.content,
        language: file.language || "plaintext",
        isFolder: file.isFolder,
        parentId,
        version: 1,
      });
    }

    // Determine default active file
    const preferredFiles = [
      "src/app/page.tsx",
      "src/App.tsx",
      "src/main.tsx",
      "src/index.tsx",
      "src/index.js",
      "main.py",
      "app.py",
      "main.rs",
      "main.go",
      "index.html",
      "README.md",
      "package.json",
    ];

    let activeRecord = fileRecordsToCreate.find(
      (f) => !f.isFolder && preferredFiles.includes(f.path)
    );

    if (!activeRecord) {
      activeRecord = fileRecordsToCreate.find((f) => !f.isFolder);
    }

    const projectId = generateId("proj");
    const initialOpenIds = activeRecord ? [activeRecord.id] : [];

    // Prisma Transaction
    const newProject = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          id: projectId,
          name: projectName,
          description:
            projectDescription ||
            `Imported ${detection.frameworkName} project (${detection.language})`,
          template: chosenTemplate,
          starred: false,
          ownerId: user.id,
          activeFileId: activeRecord ? activeRecord.id : null,
          openFileIds: JSON.stringify(initialOpenIds),
        },
      });

      // Insert files in chunks of 100 for optimal performance
      const chunkSize = 100;
      for (let i = 0; i < fileRecordsToCreate.length; i += chunkSize) {
        const chunk = fileRecordsToCreate.slice(i, i + chunkSize);
        await tx.projectFile.createMany({
          data: chunk.map((c) => ({
            id: c.id,
            projectId: createdProject.id,
            name: c.name,
            path: c.path,
            content: c.content,
            language: c.language,
            isFolder: c.isFolder,
            parentId: c.parentId,
            version: c.version,
          })),
        });
      }

      return createdProject;
    });

    return NextResponse.json({
      success: true,
      project: {
        ...newProject,
        createdAt: newProject.createdAt.getTime(),
        updatedAt: newProject.updatedAt.getTime(),
        openFileIds: initialOpenIds,
        filesCount: fileRecordsToCreate.length,
      },
      detection,
      message: `Successfully imported "${projectName}" with ${fileRecordsToCreate.length} items.`,
    });
  } catch (err) {
    console.error("Import project error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to import project." },
      { status: 500 }
    );
  }
}
