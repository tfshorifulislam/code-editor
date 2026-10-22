import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";
import { compileProjectForPreview } from "@/lib/server/previewCompiler";
import { ensureWorkspaceOnDisk } from "@/lib/server/workspaceDisk";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return new Response(
      "<!DOCTYPE html><html><body><div style='padding:20px;font-family:sans-serif;color:#ef4444;'>Unauthorized. Please sign in to view preview.</div></body></html>",
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const { id: projectId } = await params;
  const project = await getProjectById(projectId, user.id);

  if (!project) {
    return new Response(
      "<!DOCTYPE html><html><body><div style='padding:20px;font-family:sans-serif;color:#ef4444;'>Project not found or unauthorized.</div></body></html>",
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Ensure disk workspace is up to date
  await ensureWorkspaceOnDisk(project).catch((err) => console.error("Workspace disk sync warning:", err));

  const result = await compileProjectForPreview(project);

  return new Response(result.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
