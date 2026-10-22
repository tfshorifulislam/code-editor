"use client";

import React, { useState, useMemo } from "react";
import ProjectsSidebar, { DashboardViewCategory } from "./ProjectsSidebar";
import ProjectsHeader from "./ProjectsHeader";
import ProjectCard from "./ProjectCard";
import NewProjectDialog from "./NewProjectDialog";
import ProjectEmptyState from "./ProjectEmptyState";
import { Project, ProjectTemplate } from "@/types/editor";
import {
  loadProjects,
  saveProjects,
  createStarterProject,
  toggleStarProject,
  duplicateProject,
  renameProject,
  trashProject,
  restoreProject,
  deleteProjectPermanently,
  emptyTrash,
  exportProjectAsJSON,
  saveActiveProjectId,
} from "@/lib/storage/projectStorage";
import {
  LayoutTemplate,
  Trash2,
  FileCode,
  Globe,
  Layers,
  Server,
  FilePlus2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProjectsDashboard() {
  const router = useRouter();

  // Load projects with lazy initializer or useEffect
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== "undefined") {
      const existing = loadProjects();
      if (existing.length > 0) return existing;
      // Initialize with 2 rich demo projects for new users
      const reactProj = createStarterProject("react-ts", "Interactive React App");
      const webProj = createStarterProject("vanilla-web", "Modern Web Dashboard");
      const initials = [reactProj, webProj];
      saveProjects(initials);
      saveActiveProjectId(reactProj.id);
      return initials;
    }
    return [];
  });

  const [currentCategory, setCurrentCategory] = useState<DashboardViewCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState<"modified" | "name" | "created">("modified");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  // Rename modal state
  const [renamingProject, setRenamingProject] = useState<{ id: string; name: string } | null>(null);

  // Sync projects to storage
  const refreshProjects = () => {
    setProjects(loadProjects());
  };

  // Badge counts
  const counts = useMemo(() => {
    const activeProjects = projects.filter((p) => !p.isTrash);
    const trashedProjects = projects.filter((p) => p.isTrash);
    const starredProjects = activeProjects.filter((p) => p.starred);
    const recentProjects = [...activeProjects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

    return {
      all: activeProjects.length,
      recent: recentProjects.length,
      starred: starredProjects.length,
      trash: trashedProjects.length,
    };
  }, [projects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (currentCategory === "trash") {
      list = list.filter((p) => p.isTrash);
    } else {
      list = list.filter((p) => !p.isTrash);

      if (currentCategory === "starred") {
        list = list.filter((p) => p.starred);
      } else if (currentCategory === "recent") {
        list = list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
      }
    }

    // Filter by type
    if (filterType !== "all") {
      list = list.filter((p) => p.template === filterType);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.template.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "created") {
        return b.createdAt - a.createdAt;
      } else {
        return b.updatedAt - a.updatedAt;
      }
    });

    return list;
  }, [projects, currentCategory, filterType, searchQuery, sortBy]);

  // Project action handlers
  const handleStarToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStarProject(id);
    refreshProjects();
  };

  const handleDuplicate = (id: string) => {
    duplicateProject(id);
    refreshProjects();
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingProject && renamingProject.name.trim()) {
      renameProject(renamingProject.id, renamingProject.name.trim());
      setRenamingProject(null);
      refreshProjects();
    }
  };

  const handleTrash = (id: string) => {
    trashProject(id);
    refreshProjects();
  };

  const handleRestore = (id: string) => {
    restoreProject(id);
    refreshProjects();
  };

  const handleDeletePermanent = (id: string) => {
    const confirmed = window.confirm("Permanently delete this project? This cannot be undone.");
    if (confirmed) {
      deleteProjectPermanently(id);
      refreshProjects();
    }
  };

  const handleEmptyTrash = () => {
    const confirmed = window.confirm("Empty the entire trash bin? All trashed projects will be permanently deleted.");
    if (confirmed) {
      emptyTrash();
      refreshProjects();
    }
  };

  const handleCreateFromTemplate = (template: ProjectTemplate) => {
    const p = createStarterProject(template);
    const existing = loadProjects();
    saveProjects([p, ...existing]);
    saveActiveProjectId(p.id);
    router.push(`/editor/${p.id}`);
  };

  const templateShowcase: {
    id: ProjectTemplate;
    title: string;
    desc: string;
    icon: React.ReactNode;
    tag: string;
  }[] = [
    {
      id: "react-ts",
      title: "React + TypeScript",
      desc: "Interactive state counter & tasks",
      icon: <FileCode className="w-4 h-4 text-cyan-500" />,
      tag: "Popular",
    },
    {
      id: "vanilla-web",
      title: "Vanilla Web App",
      desc: "Modern HTML5, CSS & interactive JS",
      icon: <Globe className="w-4 h-4 text-amber-500" />,
      tag: "Fast",
    },
    {
      id: "next-app",
      title: "Next.js App Router",
      desc: "Fullstack App Router architecture",
      icon: <Layers className="w-4 h-4 text-neutral-800" />,
      tag: "Fullstack",
    },
    {
      id: "node-api",
      title: "Node.js REST API",
      desc: "HTTP JSON endpoints & routes",
      icon: <Server className="w-4 h-4 text-emerald-500" />,
      tag: "Backend",
    },
    {
      id: "blank",
      title: "Blank Project",
      desc: "Empty canvas scratchpad",
      icon: <FilePlus2 className="w-4 h-4 text-purple-500" />,
      tag: "Clean",
    },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#fcfcfd] overflow-hidden font-sans select-none text-[#171717]">
      {/* Left Sidebar */}
      <ProjectsSidebar
        currentCategory={currentCategory}
        onSelectCategory={setCurrentCategory}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        counts={counts}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <ProjectsHeader
          category={currentCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          filterType={filterType}
          onFilterChange={setFilterType}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onOpenNewProject={() => setIsNewProjectOpen(true)}
        />

        {/* Scrollable Project Cards Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Templates Section (Visible on 'templates' view or top of 'all' view when not searching) */}
          {(currentCategory === "templates" || (currentCategory === "all" && !searchQuery)) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-purple-500" />
                  <span>Start from a Template</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {templateShowcase.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleCreateFromTemplate(t.id)}
                    className="p-3.5 rounded-xl border border-[#eaeaea] hover:border-[var(--color-primary)] bg-white hover:bg-[#faf5ff] cursor-pointer transition shadow-2xs hover:shadow-xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-neutral-50 border border-neutral-100 group-hover:scale-105 transition-transform">
                        {t.icon}
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.2 rounded-full">
                        {t.tag}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#171717] group-hover:text-[var(--color-primary)] transition-colors truncate">
                        {t.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trash Top Action Bar */}
          {currentCategory === "trash" && counts.trash > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <span>
                Trashed projects are stored locally. You can restore them or empty the trash permanently.
              </span>
              <button
                type="button"
                onClick={handleEmptyTrash}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            </div>
          )}

          {/* Main Projects Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {currentCategory === "trash"
                  ? `Trash (${filteredProjects.length})`
                  : currentCategory === "starred"
                  ? `Starred Projects (${filteredProjects.length})`
                  : currentCategory === "recent"
                  ? `Recent Workspaces (${filteredProjects.length})`
                  : `Projects (${filteredProjects.length})`}
              </h2>
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 ? (
              <ProjectEmptyState
                category={currentCategory}
                isSearchActive={!!searchQuery}
                onOpenNewProject={() => setIsNewProjectOpen(true)}
                onClearSearch={() => setSearchQuery("")}
              />
            ) : viewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    isTrashView={currentCategory === "trash"}
                    onStarToggle={handleStarToggle}
                    onDuplicate={handleDuplicate}
                    onRename={(id, name) => setRenamingProject({ id, name })}
                    onTrash={handleTrash}
                    onRestore={handleRestore}
                    onDeletePermanent={handleDeletePermanent}
                    onExport={exportProjectAsJSON}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2.5">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="list"
                    isTrashView={currentCategory === "trash"}
                    onStarToggle={handleStarToggle}
                    onDuplicate={handleDuplicate}
                    onRename={(id, name) => setRenamingProject({ id, name })}
                    onTrash={handleTrash}
                    onRestore={handleRestore}
                    onDeletePermanent={handleDeletePermanent}
                    onExport={exportProjectAsJSON}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* New Project Creation Modal */}
      <NewProjectDialog
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreated={(id) => {
          refreshProjects();
          router.push(`/editor/${id}`);
        }}
      />

      {/* Rename Project Modal */}
      {renamingProject && (
        <div
          onClick={() => setRenamingProject(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-[#eaeaea] rounded-2xl shadow-2xl p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-[#171717]">Rename Project</h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={renamingProject.name}
                onChange={(e) =>
                  setRenamingProject({ ...renamingProject, name: e.target.value })
                }
                className="w-full bg-[#f9f9fb] border border-[#e5e5e7] focus:border-[var(--color-primary)] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingProject(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
