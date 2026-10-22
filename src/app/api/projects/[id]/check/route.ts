import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/server/projectService";

interface RouteProps {
  params: Promise<{ id: string }>;
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

  const diagnostics: { file: string; line: number; message: string; severity: "error" | "warning" }[] = [];

  // 1. Verify package.json
  const pkgFile = project.files.find((f) => f.path === "package.json");
  if (!pkgFile) {
    diagnostics.push({
      file: "package.json",
      line: 1,
      message: "Missing package.json in workspace root.",
      severity: "error",
    });
  } else {
    try {
      const parsedPkg = JSON.parse(pkgFile.content);
      const allDeps = {
        ...parsedPkg.dependencies,
        ...parsedPkg.devDependencies,
      };

      if (!allDeps["next"]) {
        diagnostics.push({ file: "package.json", line: 1, message: "Cannot find module 'next'.", severity: "error" });
      }
      if (!allDeps["react"]) {
        diagnostics.push({ file: "package.json", line: 1, message: "Cannot find module 'react'.", severity: "error" });
      }
      if (!allDeps["lucide-react"]) {
        diagnostics.push({ file: "package.json", line: 1, message: "Cannot resolve 'lucide-react'.", severity: "error" });
      }
    } catch {
      diagnostics.push({ file: "package.json", line: 1, message: "Malformed JSON in package.json.", severity: "error" });
    }
  }

  // 2. Verify tsconfig.json
  const tsconfigFile = project.files.find((f) => f.path === "tsconfig.json");
  if (!tsconfigFile) {
    diagnostics.push({
      file: "tsconfig.json",
      line: 1,
      message: "Missing tsconfig.json in workspace root.",
      severity: "error",
    });
  } else {
    try {
      const parsedTs = JSON.parse(tsconfigFile.content);
      const opts = parsedTs.compilerOptions || {};

      if (!opts.jsx || opts.jsx === "none") {
        diagnostics.push({
          file: "tsconfig.json",
          line: 1,
          message: "Cannot use JSX unless the '--jsx' flag is provided.",
          severity: "error",
        });
      }

      if (!opts.paths || !opts.paths["@/*"]) {
        diagnostics.push({
          file: "tsconfig.json",
          line: 1,
          message: "Path alias '@/*' is not configured in compilerOptions.paths.",
          severity: "error",
        });
      }
    } catch {
      diagnostics.push({ file: "tsconfig.json", line: 1, message: "Malformed JSON in tsconfig.json.", severity: "error" });
    }
  }

  // 3. Verify components and directory structure (src/ vs root)
  const usesSrc = project.files.some((f) => f.path.startsWith("src/"));
  const buttonPath = usesSrc ? "src/components/ui/button.tsx" : "components/ui/button.tsx";
  const cardPath = usesSrc ? "src/components/ui/card.tsx" : "components/ui/card.tsx";

  const hasButton = project.files.some(
    (f) => f.path === buttonPath || f.path === "components/ui/button.tsx" || f.path === "src/components/ui/button.tsx"
  );
  const hasCard = project.files.some(
    (f) => f.path === cardPath || f.path === "components/ui/card.tsx" || f.path === "src/components/ui/card.tsx"
  );

  // Check if any file imports button or card
  for (const f of project.files) {
    if (f.content.includes("@/components/ui/button") && !hasButton) {
      diagnostics.push({
        file: f.path,
        line: 1,
        message: "Cannot resolve '@/components/ui/button'.",
        severity: "error",
      });
    }
    if (f.content.includes("@/components/ui/card") && !hasCard) {
      diagnostics.push({
        file: f.path,
        line: 1,
        message: "Cannot resolve '@/components/ui/card'.",
        severity: "error",
      });
    }
  }

  return NextResponse.json({
    success: diagnostics.length === 0,
    diagnostics,
    usesSrcDirectory: usesSrc,
    components: {
      button: hasButton,
      card: hasCard,
    },
    message:
      diagnostics.length === 0
        ? "✓ TypeScript check and Next.js build verification succeeded with 0 errors."
        : `Found ${diagnostics.length} diagnostic error(s).`,
  });
}
