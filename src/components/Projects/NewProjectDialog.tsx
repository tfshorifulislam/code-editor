"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { ProjectTemplate } from "@/types/editor";
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
  const [projectName, setProjectName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>("react-ts");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const templates: {
    id: ProjectTemplate;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: "react-ts",
      title: "React + TypeScript",
      description: "Interactive component tree with state, task list, and TypeScript services.",
      icon: <FileCode className="w-5 h-5 text-cyan-500" />,
      color: "border-cyan-500/40 bg-cyan-500/5",
    },
    {
      id: "vanilla-web",
      title: "HTML / CSS / JavaScript",
      description: "Fast, responsive web scratchpad with HTML5 and interactive DOM scripts.",
      icon: <Globe className="w-5 h-5 text-amber-500" />,
      color: "border-amber-500/40 bg-amber-500/5",
    },
    {
      id: "next-app",
      title: "Next.js Web App",
      description: "Modern App Router layout with server component structures and metadata.",
      icon: <Layers className="w-5 h-5 text-neutral-800" />,
      color: "border-neutral-500/40 bg-neutral-500/5",
    },
    {
      id: "node-api",
      title: "Node.js REST API",
      description: "HTTP endpoints with JSON data handling, routes, and API testing scripts.",
      icon: <Server className="w-5 h-5 text-emerald-500" />,
      color: "border-emerald-500/40 bg-emerald-500/5",
    },
    {
      id: "python",
      title: "Python 3 Service",
      description: "Python data scripts, virtual environment, and FastAPI service endpoints.",
      icon: <FileCode className="w-5 h-5 text-blue-500" />,
      color: "border-blue-500/40 bg-blue-500/5",
    },
    {
      id: "cpp",
      title: "C++ Systems Application",
      description: "Native C++20 systems programming with Makefile and high-performance algorithms.",
      icon: <Layers className="w-5 h-5 text-indigo-500" />,
      color: "border-indigo-500/40 bg-indigo-500/5",
    },
    {
      id: "go",
      title: "Go Cloud Microservice",
      description: "Fast concurrent HTTP service with go.mod dependency tooling and standard library.",
      icon: <Globe className="w-5 h-5 text-sky-500" />,
      color: "border-sky-500/40 bg-sky-500/5",
    },
    {
      id: "rust",
      title: "Rust Systems Project",
      description: "Memory-safe systems programming with Cargo manifest and modern toolchain.",
      icon: <Server className="w-5 h-5 text-orange-500" />,
      color: "border-orange-500/40 bg-orange-500/5",
    },
    {
      id: "blank",
      title: "Blank Project",
      description: "Empty canvas with index file and markdown documentation ready for customization.",
      icon: <FilePlus2 className="w-5 h-5 text-purple-500" />,
      color: "border-purple-500/40 bg-purple-500/5",
    },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    try {
      const finalName = projectName.trim() || undefined;
      const newProject = await cloudApi.projects.create(selectedTemplate, finalName);

      onClose();
      if (onCreated) {
        onCreated(newProject.id);
      } else {
        router.push(`/editor/${newProject.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create project.";
      setError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white border border-[#eaeaea] rounded-2xl shadow-2xl p-6 space-y-5 text-[#171717] select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717]">Create New Project</h3>
              <p className="text-xs text-neutral-500">
                Choose a template to initialize your browser-based workspace.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Project Name Field */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              Project Name
            </label>
            <input
              type="text"
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. My Next.js Dashboard, Portfolio App..."
              className="w-full bg-[#f9f9fb] border border-[#e5e5e7] focus:border-[var(--color-primary)] rounded-xl px-3.5 py-2 text-xs text-[#171717] outline-none transition"
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-2">
              Select Starter Template
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]/60 shadow-xs ring-1 ring-[var(--color-primary)]"
                        : "border-[#eaeaea] hover:border-[#d1d1d6] hover:bg-neutral-50/80 bg-white"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white border border-[#eaeaea] shadow-2xs shrink-0">
                      {tpl.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#171717]">
                          {tpl.title}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-[var(--color-primary)] font-bold">
                            Selected ✓
                          </span>
                        )}
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

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60 text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer flex items-center gap-1.5"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating in Cloud...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create & Open Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

