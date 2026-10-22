import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?from=/editor");
  }

  // Find most recent active project for this user
  const recentProject = await prisma.project.findFirst({
    where: { ownerId: user.id, isTrash: false },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (recentProject) {
    redirect(`/editor/${recentProject.id}`);
  } else {
    redirect("/projects");
  }
}
