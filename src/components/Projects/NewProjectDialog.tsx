"use client";

import React, { useState, type ReactNode, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Sparkles,
  FileCode,
  Globe,
  Layers,
  Server,
  FilePlus2,
  Loader2,
  Folder,
  ArrowRight,
  ArrowLeft,
  Lock,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import {
  ProjectTemplate,
  ProjectCreationType,
  BlankSubtype,
  NextJsConfig,
} from "@/types/editor";
import { cloudApi } from "@/lib/cloud/cloudApi";

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}

export default function NewProjectDialog({
  isOpen,
  onClose,
  onCreated,
}: NewProjectDialogProps) {
  const router = useRouter();

  // Wizard state: 1 = Details, 2 = Environment, 3 = Options (if applicable), 4 = Creating
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Project Details
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectType, setProjectType] = useState<ProjectCreationType>("template");
  const [isPrivate, setIsPrivate] = useState(true);

  // Step 2: Starting Environment
  const [blankSubtype, setBlankSubtype] = useState<BlankSubtype>("empty");
  const [initGit, setInitGit] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>("next-app");

  // Step 3: Optional Technologies (Next.js)
  const [nextConfig, setNextConfig] = useState<NextJsConfig>({
    typescript: true,
    tailwind: true,
    shadcn: true,
    eslint: true,
    packageManager: "npm",
  });

  // Creation & Progress state
  const [progressStage, setProgressStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const templates: {
    id: ProjectTemplate;
    title: string;
    description: string;
    icon: ReactNode;
    tag: string;
    hasOptions?: boolean;
  }[] = [
    {
      id: "next-app",
      title: "Next.js App Router",
      description: "Modern fullstack framework with server components and metadata.",
      icon: <Layers className="w-5 h-5 text-neutral-800" />,
      tag: "Full-Stack",
      hasOptions: true,
    },
    {
      id: "react-ts",
      title: "React + Vite + TS",
      description: "Fast frontend application with React 19 and TypeScript tooling.",
      icon: <FileCode className="w-5 h-5 text-cyan-500" />,
      tag: "Frontend",
    },
    {
      id: "node-api",
      title: "Node.js & Express REST API",
      description: "Backend HTTP server with JSON routes and middleware.",
      icon: <Server className="w-5 h-5 text-emerald-500" />,
      tag: "Backend",
    },
    {
      id: "python",
      title: "Python 3 Service",
      description: "Data processing scripts, virtualenv, and service endpoints.",
      icon: <FileCode className="w-5 h-5 text-blue-500" />,
      tag: "Python",
    },
    {
      id: "vanilla-web",
      title: "HTML / CSS / JavaScript",
      description: "Lightweight browser scratchpad with interactive DOM scripts.",
      icon: <Globe className="w-5 h-5 text-amber-500" />,
      tag: "Web",
    },
    {
      id: "cpp",
      title: "C++20 Systems App",
      description: "Native C++20 algorithms with Makefile and compiler tooling.",
      icon: <Layers className="w-5 h-5 text-indigo-500" />,
      tag: "Native",
    },
    {
      id: "go",
      title: "Go Microservice",
      description: "Concurrent HTTP server with go.mod dependency management.",
      icon: <Globe className="w-5 h-5 text-sky-500" />,
      tag: "Cloud",
    },
    {
      id: "rust",
      title: "Rust Systems Project",
      description: "Memory-safe systems programming with Cargo manifest.",
      icon: <Server className="w-5 h-5 text-orange-500" />,
      tag: "Systems",
    },
  ];

  const handleNextFromStep1 = (e: FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Please enter a valid project name.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setError(null);
    // If template has configurable options (like Next.js), go to Step 3
    if (projectType === "template" && selectedTemplate === "next-app") {
      setStep(3);
    } else {
      executeCreation();
    }
  };

  const executeCreation = async () => {
    setError(null);
    setStep(4);

    try {
      // Stage 1
      setProgressStage("Creating Cloud Workspace...");
      await new Promise((r) => setTimeout(r, 400));

      // Stage 2
      setProgressStage(
        projectType === "blank"
          ? blankSubtype === "empty"
            ? "Initializing Empty Workspace..."
            : "Generating Basic Web Files..."
          : `Configuring ${selectedTemplate} Toolchain...`
      );
      await new Promise((r) => setTimeout(r, 400));

      if (projectType === "template" && selectedTemplate === "next-app" && nextConfig.shadcn) {
        setProgressStage("Configuring shadcn/ui and Tailwind components...");
        await new Promise((r) => setTimeout(r, 400));
      }

      // Execute cloud project creation
      const created = await cloudApi.projects.create({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        type: projectType,
        template: projectType === "template" ? selectedTemplate : undefined,
        blankSubtype: projectType === "blank" ? blankSubtype : undefined,
        initGit,
        isPrivate,
        nextConfig: selectedTemplate === "next-app" ? nextConfig : undefined,
      });

      setProgressStage("Ready — Opening Cloud IDE...");
      await new Promise((r) => setTimeout(r, 300));

      onClose();
      if (onCreated) {
        onCreated(created.id);
      } else {
        router.push(`/editor/${created.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create project.";
      setError(msg);
      setStep(2);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white border border-[#eaeaea] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-6 text-[#171717] select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white shadow-xs">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717]">New Cloud Project</h3>
              <p className="text-xs text-neutral-500">
                {step === 1 && "Step 1 of 3 — Project Details"}
                {step === 2 && "Step 2 of 3 — Starting Environment"}
                {step === 3 && "Step 3 of 3 — Optional Technologies"}
                {step === 4 && "Provisioning Cloud Workspace..."}
              </p>
            </div>
          </div>
          {step !== 4 && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step 1: Project Details */}
        {step === 1 && (
          <form onSubmit={handleNextFromStep1} className="space-y-5">
            {/* Project Name */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. cloud-analytics-dashboard"
                className="w-full bg-[#f9f9fb] border border-[#e5e5e7] focus:border-[var(--color-primary)] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#171717] outline-none transition"
              />
            </div>

            {/* Project Type: Blank vs Template */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-2">
                Project Setup Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Blank Project Card */}
                <div
                  onClick={() => setProjectType("blank")}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                    projectType === "blank"
                      ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]/50 ring-1 ring-[var(--color-primary)] shadow-xs"
                      : "border-[#eaeaea] hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                      <Folder className="w-4 h-4" />
                    </div>
                    {projectType === "blank" && (
                      <span className="text-[10px] text-[var(--color-primary)] font-bold">
                        Selected ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#171717]">Blank Project</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      Start with an empty workspace. Add languages, frameworks, or tools later.
                    </p>
                  </div>
                </div>

                {/* Template Project Card */}
                <div
                  onClick={() => setProjectType("template")}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                    projectType === "template"
                      ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]/50 ring-1 ring-[var(--color-primary)] shadow-xs"
                      : "border-[#eaeaea] hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-[var(--color-primary)]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    {projectType === "template" && (
                      <span className="text-[10px] text-[var(--color-primary)] font-bold">
                        Selected ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#171717]">Template Project</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      Start with a clean, working template for Next.js, React, Node, Python, etc.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Description */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                Description <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Brief summary of your project..."
                className="w-full bg-[#f9f9fb] border border-[#e5e5e7] focus:border-[var(--color-primary)] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#171717] outline-none transition"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="p-3 bg-[#fbfbfd] border border-[#eaeaea] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-neutral-500" />
                <div>
                  <span className="font-semibold text-neutral-800">Private Cloud Project</span>
                  <p className="text-[11px] text-neutral-400">Only accessible by your authenticated account</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="accent-[var(--color-primary)] w-4 h-4 cursor-pointer"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Choose Starting Environment */}
        {step === 2 && (
          <div className="space-y-4">
            {projectType === "blank" ? (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  Select your blank workspace configuration:
                </p>

                {/* Empty Workspace Option */}
                <div
                  onClick={() => setBlankSubtype("empty")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    blankSubtype === "empty"
                      ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]/50 ring-1 ring-[var(--color-primary)]"
                      : "border-[#eaeaea] hover:bg-neutral-50"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-[#eaeaea] shadow-2xs">
                    <FilePlus2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        Completely Empty Workspace (0 files)
                      </span>
                      {blankSubtype === "empty" && (
                        <span className="text-[10px] text-[var(--color-primary)] font-bold">
                          Selected ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      Genuinely empty folder. No demo files, no fake application code, no unsolicited dependencies.
                    </p>
                  </div>
                </div>

                {/* Basic Web Files Option */}
                <div
                  onClick={() => setBlankSubtype("basic-web")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    blankSubtype === "basic-web"
                      ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]/50 ring-1 ring-[var(--color-primary)]"
                      : "border-[#eaeaea] hover:bg-neutral-50"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-[#eaeaea] shadow-2xs">
                    <Globe className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        Basic Web Files (index.html & styles.css)
                      </span>
                      {blankSubtype === "basic-web" && (
                        <span className="text-[10px] text-[var(--color-primary)] font-bold">
                          Selected ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      Minimal standard HTML5 entrypoint and stylesheet for quick frontend scripting.
                    </p>
                  </div>
                </div>

                {/* Git Repository Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 p-3 bg-[#fbfbfd] border border-[#eaeaea] rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={initGit}
                      onChange={(e) => setInitGit(e.target.checked)}
                      className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <GitBranch className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-neutral-700">
                      Initialize Git repository configuration (.gitignore)
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500">
                  Select a verified starter template:
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {templates.map((tpl) => {
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]/50 ring-1 ring-[var(--color-primary)]"
                            : "border-[#eaeaea] hover:border-neutral-300 hover:bg-neutral-50/80 bg-white"
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white border border-[#eaeaea] shadow-2xs shrink-0">
                          {tpl.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#171717]">
                              {tpl.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-neutral-100 text-neutral-600">
                                {tpl.tag}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] text-[var(--color-primary)] font-bold">
                                  ✓
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <span>
                  {projectType === "template" && selectedTemplate === "next-app"
                    ? "Configure Tooling"
                    : "Create Project"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optional Technologies (Next.js) */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-[#171717]">
                Configure Next.js Technologies
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                Choose only the official dependencies and tooling for this project:
              </p>
            </div>

            <div className="space-y-2.5 bg-[#fbfbfd] border border-[#eaeaea] rounded-2xl p-4">
              {/* TypeScript */}
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition">
                <div>
                  <span className="text-xs font-bold text-neutral-900">TypeScript</span>
                  <p className="text-[11px] text-neutral-500">Includes tsconfig.json and strict type checking</p>
                </div>
                <input
                  type="checkbox"
                  checked={nextConfig.typescript}
                  onChange={(e) => setNextConfig({ ...nextConfig, typescript: e.target.checked })}
                  className="accent-[var(--color-primary)] w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Tailwind CSS */}
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition">
                <div>
                  <span className="text-xs font-bold text-neutral-900">Tailwind CSS</span>
                  <p className="text-[11px] text-neutral-500">Configures tailwind.config.ts and utility classes</p>
                </div>
                <input
                  type="checkbox"
                  checked={nextConfig.tailwind}
                  onChange={(e) => setNextConfig({ ...nextConfig, tailwind: e.target.checked })}
                  className="accent-[var(--color-primary)] w-4 h-4 cursor-pointer"
                />
              </label>

              {/* shadcn/ui */}
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition">
                <div>
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>shadcn/ui</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                      Recommended
                    </span>
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Generates components.json, @/lib/utils, and Button & Card components
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={nextConfig.shadcn}
                  onChange={(e) => setNextConfig({ ...nextConfig, shadcn: e.target.checked })}
                  className="accent-[var(--color-primary)] w-4 h-4 cursor-pointer"
                />
              </label>

              {/* ESLint */}
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition">
                <div>
                  <span className="text-xs font-bold text-neutral-900">ESLint</span>
                  <p className="text-[11px] text-neutral-500">Next.js recommended linting rules</p>
                </div>
                <input
                  type="checkbox"
                  checked={nextConfig.eslint}
                  onChange={(e) => setNextConfig({ ...nextConfig, eslint: e.target.checked })}
                  className="accent-[var(--color-primary)] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Package Manager Selection */}
            <div className="flex items-center justify-between p-3 border border-[#eaeaea] rounded-xl text-xs">
              <span className="font-semibold text-neutral-700">Package Manager</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNextConfig({ ...nextConfig, packageManager: "npm" })}
                  className={`px-3 py-1 rounded-lg font-mono font-semibold transition cursor-pointer ${
                    nextConfig.packageManager === "npm"
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  npm
                </button>
                <button
                  type="button"
                  onClick={() => setNextConfig({ ...nextConfig, packageManager: "pnpm" })}
                  className={`px-3 py-1 rounded-lg font-mono font-semibold transition cursor-pointer ${
                    nextConfig.packageManager === "pnpm"
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  pnpm
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={executeCreation}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Provisioning Progress State */}
        {step === 4 && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-primary)]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900">{progressStage}</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Setting up your isolated cloud development workspace...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
