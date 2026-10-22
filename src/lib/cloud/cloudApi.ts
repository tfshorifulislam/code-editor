import { Project, ProjectFile, ProjectTemplate } from "@/types/editor";

export interface CloudUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
  settings?: {
    theme?: string;
    fontSize?: number;
    tabSize?: number;
    wordWrap?: string;
    minimap?: boolean;
  } | null;
}

export interface SaveResult {
  file?: ProjectFile;
  conflict?: boolean;
  serverVersion?: number;
  serverContent?: string;
  error?: string;
}

export const cloudApi = {
  auth: {
    async getMe(): Promise<CloudUser | null> {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return null;
        const data = await res.json();
        return data.user || null;
      } catch {
        return null;
      }
    },

    async signup(email: string, password: string, name?: string): Promise<{ user: CloudUser; error?: string }> {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }
      return data;
    },

    async login(email: string, password: string): Promise<{ user: CloudUser; error?: string }> {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in.");
      }
      return data;
    },

    async logout(): Promise<void> {
      await fetch("/api/auth/logout", { method: "POST" });
    },
  },

  projects: {
    async list(category: "all" | "recent" | "starred" | "trash" = "all"): Promise<Project[]> {
      const res = await fetch(`/api/projects?category=${category}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        throw new Error("Failed to load cloud projects.");
      }
      const data = await res.json();
      return (data.projects || []).map((p: Record<string, unknown>) => ({
        ...p,
        createdAt: typeof p.createdAt === "string" ? new Date(p.createdAt).getTime() : p.createdAt,
        updatedAt: typeof p.updatedAt === "string" ? new Date(p.updatedAt).getTime() : p.updatedAt,
        openFileIds: typeof p.openFileIds === "string" ? JSON.parse(p.openFileIds) : p.openFileIds || [],
        files: p.files || [],
      }));
    },

    async get(id: string): Promise<Project> {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (res.status === 404) throw new Error("NOT_FOUND");
        throw new Error("Failed to load project from cloud.");
      }
      const data = await res.json();
      const p = data.project;
      return {
        ...p,
        createdAt: typeof p.createdAt === "string" ? new Date(p.createdAt).getTime() : p.createdAt,
        updatedAt: typeof p.updatedAt === "string" ? new Date(p.updatedAt).getTime() : p.updatedAt,
        openFileIds: typeof p.openFileIds === "string" ? JSON.parse(p.openFileIds) : p.openFileIds || [],
      };
    },

    async create(template: ProjectTemplate, name?: string, description?: string): Promise<Project> {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project in cloud.");
      const p = data.project;
      return {
        ...p,
        createdAt: typeof p.createdAt === "string" ? new Date(p.createdAt).getTime() : p.createdAt,
        updatedAt: typeof p.updatedAt === "string" ? new Date(p.updatedAt).getTime() : p.updatedAt,
        openFileIds: typeof p.openFileIds === "string" ? JSON.parse(p.openFileIds) : p.openFileIds || [],
      };
    },

    async update(
      id: string,
      payload: {
        name?: string;
        description?: string;
        starred?: boolean;
        isTrash?: boolean;
        activeFileId?: string | null;
        openFileIds?: string[];
      }
    ): Promise<void> {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update project metadata.");
      }
    },

    async duplicate(id: string): Promise<Project> {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate project.");
      return data.project;
    },

    async delete(id: string, permanent: boolean = false): Promise<void> {
      const res = await fetch(`/api/projects/${id}?permanent=${permanent}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project.");
    },

    async emptyTrash(): Promise<void> {
      const res = await fetch("/api/projects/trash/empty", { method: "POST" });
      if (!res.ok) throw new Error("Failed to empty trash.");
    },
  },

  files: {
    async create(
      projectId: string,
      payload: { name: string; isFolder: boolean; parentId?: string | null; content?: string }
    ): Promise<ProjectFile> {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create file in cloud.");
      return data.file;
    },

    async saveContent(
      projectId: string,
      fileId: string,
      content: string,
      version?: number
    ): Promise<SaveResult> {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, version }),
      });
      const data = await res.json();
      if (res.status === 409) {
        return {
          conflict: true,
          serverVersion: data.serverVersion,
          serverContent: data.serverContent,
          error: data.error,
        };
      }
      if (!res.ok) {
        return { error: data.error || "Save failed." };
      }
      return { file: data.file };
    },

    async rename(projectId: string, fileId: string, newName: string): Promise<ProjectFile> {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename file in cloud.");
      return data.file;
    },

    async delete(projectId: string, fileId: string): Promise<void> {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file from cloud.");
    },
  },
};
