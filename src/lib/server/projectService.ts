import prisma from "@/lib/db/prisma";
import { ProjectTemplate } from "@/types/editor";
import { getTemplateFiles } from "@/lib/storage/projectStorage";
import crypto from "crypto";

function generateId(prefix: string = "id"): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

export async function createCloudProject(
  ownerId: string,
  template: ProjectTemplate = "react-ts",
  name?: string,
  description?: string
) {
  const { files: templateFiles, activeFileId, openFileIds } = getTemplateFiles(template);

  const defaultNames: Record<ProjectTemplate, string> = {
    "react-ts": "Interactive React App",
    "vanilla-web": "Modern Web Application",
    "next-app": "Next.js App Router Service",
    "node-api": "Node.js REST API",
    python: "Python 3 Analytics Service",
    cpp: "C++20 High Performance App",
    go: "Go Cloud Microservice",
    rust: "Rust Systems Project",
    blank: "Blank Project Scratchpad",
  };

  const projectName = name?.trim() || defaultNames[template] || "New Project";
  const projectId = generateId("proj");

  // Map old template file IDs to fresh unique IDs while preserving parent-child relations
  const idMap = new Map<string, string>();
  for (const f of templateFiles) {
    idMap.set(f.id, generateId("f"));
  }

  const mappedActiveFileId = activeFileId && idMap.has(activeFileId) ? idMap.get(activeFileId) : null;
  const mappedOpenFileIds = openFileIds.map((id) => idMap.get(id) || id);

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        id: projectId,
        name: projectName,
        description: description || null,
        template,
        ownerId,
        starred: false,
        isTrash: false,
        activeFileId: mappedActiveFileId,
        openFileIds: JSON.stringify(mappedOpenFileIds),
      },
    });

    for (const f of templateFiles) {
      const newId = idMap.get(f.id)!;
      const newParentId = f.parentId && idMap.has(f.parentId) ? idMap.get(f.parentId) : null;

      await tx.projectFile.create({
        data: {
          id: newId,
          projectId: project.id,
          name: f.name,
          path: f.path,
          content: f.content || "",
          language: f.language || (f.isFolder ? "" : "plaintext"),
          isFolder: f.isFolder,
          parentId: newParentId,
          version: 1,
        },
      });
    }

    return tx.project.findUnique({
      where: { id: project.id },
      include: {
        files: {
          orderBy: { path: "asc" },
        },
      },
    });
  });
}

export async function seedStarterProjectsForUser(userId: string) {
  const existingCount = await prisma.project.count({
    where: { ownerId: userId },
  });

  if (existingCount > 0) return;

  await createCloudProject(
    userId,
    "react-ts",
    "Interactive React App",
    "State counter and interactive task management with live React preview."
  );

  await createCloudProject(
    userId,
    "vanilla-web",
    "Modern Web Dashboard",
    "HTML5, responsive CSS grid, and interactive JavaScript widgets."
  );
}

export async function getUserProjects(userId: string, category: "all" | "recent" | "starred" | "trash" = "all") {
  const whereClause: {
    ownerId: string;
    isTrash?: boolean;
    starred?: boolean;
  } = { ownerId: userId };

  if (category === "trash") {
    whereClause.isTrash = true;
  } else {
    whereClause.isTrash = false;
    if (category === "starred") {
      whereClause.starred = true;
    }
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    take: category === "recent" ? 8 : undefined,
    select: {
      id: true,
      name: true,
      description: true,
      template: true,
      starred: true,
      isTrash: true,
      trashedAt: true,
      activeFileId: true,
      openFileIds: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { files: true },
      },
      files: {
        where: { isFolder: false },
        take: 3,
        select: {
          id: true,
          name: true,
          path: true,
          content: true,
          language: true,
        },
      },
    },
  });

  return projects;
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    include: {
      files: {
        orderBy: [{ isFolder: "desc" }, { path: "asc" }],
      },
    },
  });

  return project;
}

export async function updateProjectMetadata(
  projectId: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    starred?: boolean;
    isTrash?: boolean;
    activeFileId?: string | null;
    openFileIds?: string[];
  }
) {
  // Validate ownership
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.starred !== undefined) updateData.starred = data.starred;
  if (data.isTrash !== undefined) {
    updateData.isTrash = data.isTrash;
    updateData.trashedAt = data.isTrash ? new Date() : null;
  }
  if (data.activeFileId !== undefined) updateData.activeFileId = data.activeFileId;
  if (data.openFileIds !== undefined) updateData.openFileIds = JSON.stringify(data.openFileIds);

  return prisma.project.update({
    where: { id: projectId },
    data: updateData,
  });
}

export async function deleteProject(projectId: string, userId: string, permanent: boolean = false) {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!existing) return null;

  if (permanent) {
    return prisma.project.delete({
      where: { id: projectId },
    });
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      isTrash: true,
      trashedAt: new Date(),
    },
  });
}

export async function emptyTrashForUser(userId: string) {
  return prisma.project.deleteMany({
    where: {
      ownerId: userId,
      isTrash: true,
    },
  });
}

export async function duplicateProject(projectId: string, userId: string) {
  const source = await getProjectById(projectId, userId);
  if (!source) return null;

  const newProject = await createCloudProject(
    userId,
    source.template as ProjectTemplate,
    `${source.name} (Copy)`,
    source.description || undefined
  );

  return newProject;
}

export async function createProjectFile(
  projectId: string,
  userId: string,
  data: {
    name: string;
    isFolder: boolean;
    parentId?: string | null;
    content?: string;
  }
) {
  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) return null;

  // Sanitize name: remove path separators
  const sanitizedName = data.name.replace(/[/\\?%*:|"<>]/g, "").trim();
  if (!sanitizedName) throw new Error("Invalid file name");

  // Resolve parent path
  let parentPath = "";
  if (data.parentId) {
    const parent = await prisma.projectFile.findFirst({
      where: { id: data.parentId, projectId },
    });
    if (parent) {
      parentPath = parent.path;
    }
  }

  const filePath = parentPath ? `${parentPath}/${sanitizedName}` : sanitizedName;
  const ext = sanitizedName.split(".").pop() || "plaintext";
  const fileId = generateId("f");

  const [newFile] = await prisma.$transaction([
    prisma.projectFile.create({
      data: {
        id: fileId,
        projectId,
        name: sanitizedName,
        path: filePath,
        content: data.content || (data.isFolder ? "" : `// ${sanitizedName}\n`),
        language: data.isFolder ? "" : ext,
        isFolder: data.isFolder,
        parentId: data.parentId || null,
        version: 1,
      },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return newFile;
}

export async function updateProjectFileContent(
  projectId: string,
  fileId: string,
  userId: string,
  content: string,
  clientVersion?: number
) {
  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) return { error: "Project not found or unauthorized", status: 404 };

  const file = await prisma.projectFile.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) return { error: "File not found", status: 404 };

  // Optimistic concurrency check: if client sent version and server is newer
  if (clientVersion !== undefined && clientVersion < file.version) {
    return {
      conflict: true,
      serverVersion: file.version,
      serverContent: file.content,
      error: "Conflict: server has a newer version of this file.",
      status: 409,
    };
  }

  const nextVersion = file.version + 1;

  const [updatedFile] = await prisma.$transaction([
    prisma.projectFile.update({
      where: { id: fileId },
      data: {
        content,
        version: nextVersion,
        updatedAt: new Date(),
      },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return { file: updatedFile, status: 200 };
}

export async function renameProjectFile(
  projectId: string,
  fileId: string,
  userId: string,
  newName: string
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) return null;

  const file = await prisma.projectFile.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) return null;

  const sanitizedName = newName.replace(/[/\\?%*:|"<>]/g, "").trim();
  if (!sanitizedName) throw new Error("Invalid file name");

  const pathSegments = file.path.split("/");
  pathSegments[pathSegments.length - 1] = sanitizedName;
  const newPath = pathSegments.join("/");

  if (file.isFolder) {
    // If folder, also update all descendants' paths
    const oldPrefix = `${file.path}/`;
    const newPrefix = `${newPath}/`;

    const descendants = await prisma.projectFile.findMany({
      where: {
        projectId,
        path: { startsWith: oldPrefix },
      },
    });

    await prisma.$transaction([
      prisma.projectFile.update({
        where: { id: fileId },
        data: { name: sanitizedName, path: newPath },
      }),
      ...descendants.map((d) =>
        prisma.projectFile.update({
          where: { id: d.id },
          data: { path: `${newPrefix}${d.path.slice(oldPrefix.length)}` },
        })
      ),
      prisma.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.projectFile.update({
        where: { id: fileId },
        data: {
          name: sanitizedName,
          path: newPath,
          language: sanitizedName.split(".").pop() || "plaintext",
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  return prisma.projectFile.findUnique({ where: { id: fileId } });
}

export async function deleteProjectFile(
  projectId: string,
  fileId: string,
  userId: string
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) return null;

  const file = await prisma.projectFile.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) return null;

  if (file.isFolder) {
    // Collect all descendants recursively
    const prefix = `${file.path}/`;
    await prisma.$transaction([
      prisma.projectFile.deleteMany({
        where: {
          projectId,
          path: { startsWith: prefix },
        },
      }),
      prisma.projectFile.delete({
        where: { id: fileId },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.projectFile.delete({
        where: { id: fileId },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  return { success: true };
}
