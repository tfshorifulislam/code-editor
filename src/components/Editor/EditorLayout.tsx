"use client";

import React, { useState, useEffect, useCallback, useRef, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ActivityBar from "./ActivityBar";
import FileExplorer from "./FileExplorer";
import EditorTabs from "./EditorTabs";
import MonacoEditorComponent from "./MonacoEditor";
import TerminalPanel from "./TerminalPanel";
import PreviewPanel from "./PreviewPanel";
import AIAssistantPanel from "./AIAssistantPanel";
import StatusBar from "./StatusBar";
import CommandPalette, { CommandItem } from "./CommandPalette";
import GitPanel from "./GitPanel";
import DebugPanel from "./DebugPanel";
import ExtensionsPanel from "./ExtensionsPanel";
import InitializeProjectDialog from "./InitializeProjectDialog";
import { cloudApi } from "@/lib/cloud/cloudApi";
import {
  Project,
  ProjectFile,
  SidebarView,
  BottomTab,
  EditorSettings,
  ConsoleMessage,
  ProjectTemplate,
} from "@/types/editor";
import {
  createStarterProject,
  loadProjects,
  saveProjects,
  loadActiveProjectId,
  saveActiveProjectId,
  loadEditorSettings,
  saveEditorSettings,
  exportProjectAsJSON,
} from "@/lib/storage/projectStorage";
import {
  Search,
  FileCode,
  FolderGit2,
  Download,
  Plus,
  Sparkles,
  Save,
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  RefreshCw,
  Moon,
  Sun,
  X,
  ArrowLeft,
  Cloud,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

let layoutCounter = 1000;
function getEditorUniqueId(prefix: string): string {
  layoutCounter += 1;
  return `${prefix}-${layoutCounter}`;
}
function getTimestamp(): number {
  return 1700000000000 + layoutCounter;
}

interface EditorLayoutProps {
  initialProjectId?: string;
}

export default function EditorLayout({ initialProjectId }: EditorLayoutProps) {
  const router = useRouter();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");

  // 1. Projects & active project state with lazy initializer
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== "undefined") {
      const existing = loadProjects();
      if (existing.length > 0) return existing;
      const initial = createStarterProject("react-ts", "Interactive React App");
      saveProjects([initial]);
      saveActiveProjectId(initial.id);
      return [initial];
    }
    return [createStarterProject("react-ts", "Interactive React App")];
  });

  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    if (typeof window !== "undefined") {
      const existing = loadProjects();
      if (initialProjectId) {
        const found = existing.find((p) => p.id === initialProjectId);
        if (found) {
          saveActiveProjectId(found.id);
          return found;
        }
      }
      const activeId = loadActiveProjectId();
      if (existing.length > 0) {
        return existing.find((p) => p.id === activeId) || existing[0];
      }
      const initial = createStarterProject("react-ts", "Interactive React App");
      return initial;
    }
    return null;
  });

  // Fetch full project from cloud API if initialProjectId is provided
  useEffect(() => {
    if (!initialProjectId) return;
    let isCancelled = false;

    async function fetchProject() {
      try {
        const cloudProj = await cloudApi.projects.get(initialProjectId!);
        if (!isCancelled && cloudProj) {
          setActiveProject(cloudProj);
        }
      } catch (err: unknown) {
        if (!isCancelled && err instanceof Error && err.message === "UNAUTHORIZED") {
          router.push(`/login?from=/editor/${initialProjectId}`);
        }
      }
    }

    fetchProject();
    return () => {
      isCancelled = true;
    };
  }, [initialProjectId, router]);

  // Warn on tab close/reload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved" || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  const [unsavedFiles, setUnsavedFiles] = useState<Record<string, boolean>>({});

  // 2. Views & Panels
  const [activeSidebarView, setActiveSidebarView] = useState<SidebarView | null>("explorer");
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalTab, setTerminalTab] = useState<BottomTab>("terminal");
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isInitializeDialogOpen, setIsInitializeDialogOpen] = useState(false);

  // 3. Settings & diagnostics
  const [settings, setSettings] = useState<EditorSettings>(() => loadEditorSettings());
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync active project state to storage
  useEffect(() => {
    if (!activeProject) return;
    saveActiveProjectId(activeProject.id);
    const updated = projects.map((p) => (p.id === activeProject.id ? activeProject : p));
    saveProjects(updated);
  }, [activeProject, projects]);

  // Active file helper
  const activeFile = activeProject?.files.find((f) => f.id === activeProject.activeFileId) || null;
  const openFiles = (activeProject?.openFileIds || [])
    .map((id) => activeProject?.files.find((f) => f.id === id))
    .filter((f): f is ProjectFile => !!f && !f.isFolder);

  // File Operations
  const handleSelectFile = useCallback((fileId: string) => {
    if (!activeProject) return;
    const file = activeProject.files.find((f) => f.id === fileId);
    if (!file || file.isFolder) return;

    const nextOpen = activeProject.openFileIds.includes(fileId)
      ? activeProject.openFileIds
      : [...activeProject.openFileIds, fileId];

    setActiveProject({
      ...activeProject,
      activeFileId: fileId,
      openFileIds: nextOpen,
      updatedAt: Date.now(),
    });
  }, [activeProject]);

  const handleCloseTab = (fileId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!activeProject) return;

    const nextOpen = activeProject.openFileIds.filter((id) => id !== fileId);
    let nextActive = activeProject.activeFileId;

    if (activeProject.activeFileId === fileId) {
      nextActive = nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : null;
    }

    // Clean unsaved status
    setUnsavedFiles((prev) => {
      const copy = { ...prev };
      delete copy[fileId];
      return copy;
    });

    setActiveProject({
      ...activeProject,
      activeFileId: nextActive,
      openFileIds: nextOpen,
      updatedAt: getTimestamp(),
    });
  };

  const performCloudSave = useCallback(
    async (fileId: string, content: string, currentVersion?: number) => {
      if (!activeProject) return;
      setSaveStatus("saving");
      try {
        const res = await cloudApi.files.saveContent(activeProject.id, fileId, content, currentVersion);
        if (res.conflict) {
          setSaveStatus("error");
          setConsoleMessages((prev) => [
            ...prev,
            {
              id: getEditorUniqueId("conflict"),
              type: "warn",
              content: "⚠ Conflict detected: server has a newer version of this file.",
              timestamp: getTimestamp(),
            },
          ]);
          return;
        }
        if (res.error) {
          setSaveStatus("error");
          return;
        }
        setSaveStatus("saved");
        setUnsavedFiles((prev) => ({ ...prev, [fileId]: false }));
      } catch {
        setSaveStatus("error");
      }
    },
    [activeProject]
  );

  const handleContentChange = (newContent: string) => {
    if (!activeProject || !activeFile) return;

    setSaveStatus("unsaved");
    setUnsavedFiles((prev) => ({ ...prev, [activeFile.id]: true }));

    const updatedFiles = activeProject.files.map((f) =>
      f.id === activeFile.id ? { ...f, content: newContent } : f
    );

    setActiveProject({
      ...activeProject,
      files: updatedFiles,
    });

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performCloudSave(activeFile.id, newContent, activeFile.version);
    }, 1200);
  };

  const handleSaveActiveFile = useCallback(() => {
    if (!activeProject || !activeFile) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    performCloudSave(activeFile.id, activeFile.content, activeFile.version);
    setConsoleMessages((prev) => [
      ...prev,
      {
        id: getEditorUniqueId("c"),
        type: "info",
        content: `✓ Cloud saved ${activeFile.path}`,
        timestamp: getTimestamp(),
      },
    ]);
  }, [activeProject, activeFile, performCloudSave]);

  const handleCreateFile = async (name: string, isFolder: boolean, parentId: string | null) => {
    if (!activeProject) return;

    const parent = activeProject.files.find((f) => f.id === parentId);
    const parentPath = parent ? parent.path : "";
    const newPath = parentPath ? `${parentPath}/${name}` : name;
    const tempId = getEditorUniqueId("file");

    const newFile: ProjectFile = {
      id: tempId,
      name,
      path: newPath,
      content: isFolder ? "" : `// ${name}\n`,
      language: isFolder ? "" : name.split(".").pop() || "plaintext",
      isFolder,
      parentId,
      version: 1,
    };

    const nextFiles = [...activeProject.files, newFile];
    const nextOpen = isFolder ? activeProject.openFileIds : [...activeProject.openFileIds, newFile.id];

    setActiveProject({
      ...activeProject,
      files: nextFiles,
      activeFileId: isFolder ? activeProject.activeFileId : newFile.id,
      openFileIds: nextOpen,
      updatedAt: getTimestamp(),
    });

    if (initialProjectId || activeProject.id.startsWith("proj_")) {
      try {
        const serverFile = await cloudApi.files.create(activeProject.id, {
          name,
          isFolder,
          parentId,
          content: newFile.content,
        });
        if (serverFile) {
          setActiveProject((prev) => {
            if (!prev) return null;
            const updatedFiles = prev.files.map((f) => (f.id === tempId ? serverFile : f));
            const updatedOpen = prev.openFileIds.map((id) => (id === tempId ? serverFile.id : id));
            const updatedActive = prev.activeFileId === tempId ? serverFile.id : prev.activeFileId;
            return {
              ...prev,
              files: updatedFiles,
              openFileIds: updatedOpen,
              activeFileId: updatedActive,
            };
          });
        }
      } catch (err) {
        console.error("Cloud file creation error:", err);
      }
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    if (!activeProject) return;
    const updated = activeProject.files.map((f) => {
      if (f.id !== fileId) return f;
      const parts = f.path.split("/");
      parts[parts.length - 1] = newName;
      return { ...f, name: newName, path: parts.join("/") };
    });
    setActiveProject({ ...activeProject, files: updated, updatedAt: getTimestamp() });

    if (initialProjectId || activeProject.id.startsWith("proj_")) {
      try {
        await cloudApi.files.rename(activeProject.id, fileId, newName);
      } catch (err) {
        console.error("Cloud file rename error:", err);
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!activeProject) return;

    // Collect all descendant ids if folder
    const toDeleteIds = new Set<string>([fileId]);
    const findChildren = (pid: string) => {
      activeProject.files.forEach((f) => {
        if (f.parentId === pid) {
          toDeleteIds.add(f.id);
          findChildren(f.id);
        }
      });
    };
    findChildren(fileId);

    const nextFiles = activeProject.files.filter((f) => !toDeleteIds.has(f.id));
    const nextOpen = activeProject.openFileIds.filter((id) => !toDeleteIds.has(id));
    const nextActive = toDeleteIds.has(activeProject.activeFileId || "")
      ? nextOpen[nextOpen.length - 1] || null
      : activeProject.activeFileId;

    setActiveProject({
      ...activeProject,
      files: nextFiles,
      openFileIds: nextOpen,
      activeFileId: nextActive,
      updatedAt: getTimestamp(),
    });

    if (initialProjectId || activeProject.id.startsWith("proj_")) {
      try {
        await cloudApi.files.delete(activeProject.id, fileId);
      } catch (err) {
        console.error("Cloud file delete error:", err);
      }
    }
  };

  const handleApplyDiff = (fileId: string, newContent: string) => {
    if (!activeProject) return;
    const targetFile = activeProject.files.find((f) => f.id === fileId);
    if (!targetFile) return;

    const updatedFiles = activeProject.files.map((f) =>
      f.id === fileId ? { ...f, content: newContent } : f
    );

    setActiveProject({
      ...activeProject,
      files: updatedFiles,
      updatedAt: getTimestamp(),
    });

    setConsoleMessages((prev) => [
      ...prev,
      {
        id: getEditorUniqueId("ai"),
        type: "info",
        content: `✓ AI Diff applied to ${targetFile.path}`,
        timestamp: getTimestamp(),
      },
    ]);
  };

  const handleResetProject = () => {
    if (!activeProject) return;
    const confirmed = window.confirm("Reset this project's files back to starter template?");
    if (!confirmed) return;

    const fresh = createStarterProject(activeProject.template, activeProject.name);
    setActiveProject({ ...fresh, id: activeProject.id });
  };

  const handleSwitchTemplate = (template: ProjectTemplate) => {
    const fresh = createStarterProject(template);
    const updatedList = [...projects, fresh];
    setProjects(updatedList);
    setActiveProject(fresh);
    saveProjects(updatedList);
    saveActiveProjectId(fresh.id);
    setIsProjectModalOpen(false);
  };

  const handleConsoleMessage = (type: "log" | "error" | "warn" | "info", text: string) => {
    setConsoleMessages((prev) => [
      ...prev.slice(-100),
      {
        id: getEditorUniqueId("msg"),
        type,
        content: text,
        timestamp: getTimestamp(),
      },
    ]);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveActiveFile();
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "p" && !e.shiftKey) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setActiveSidebarView((prev) => (prev ? null : "explorer"));
      } else if (isCmdOrCtrl && e.key === "`") {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleSaveActiveFile]);

  // Command Palette Items
  const commandList: CommandItem[] = [
    {
      id: "cmd-save",
      title: "File: Save",
      category: "File",
      shortcut: "Ctrl+S",
      icon: <Save className="w-4 h-4 text-emerald-400" />,
      action: () => handleSaveActiveFile(),
    },
    {
      id: "cmd-new-file",
      title: "File: New File",
      category: "File",
      icon: <Plus className="w-4 h-4 text-cyan-400" />,
      action: () => {
        setActiveSidebarView("explorer");
      },
    },
    {
      id: "cmd-preview",
      title: "View: Toggle Live Preview",
      category: "View",
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      action: () => setIsPreviewOpen((prev) => !prev),
    },
    {
      id: "cmd-terminal",
      title: "View: Toggle Terminal Panel",
      category: "View",
      shortcut: "Ctrl+`",
      icon: <TerminalIcon className="w-4 h-4 text-cyan-400" />,
      action: () => setIsTerminalOpen((prev) => !prev),
    },
    {
      id: "cmd-ai",
      title: "AI: Toggle AI Coding Assistant",
      category: "AI",
      icon: <Sparkles className="w-4 h-4 text-[#a78bfa]" />,
      action: () => setIsAIOpen((prev) => !prev),
    },
    {
      id: "cmd-theme",
      title: `Preferences: Switch to ${settings.theme === "vs-dark" ? "Light" : "Dark"} Theme`,
      category: "Preferences",
      icon: settings.theme === "vs-dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />,
      action: () => {
        const next = settings.theme === "vs-dark" ? "light" : "vs-dark";
        const updated = { ...settings, theme: next as "vs-dark" | "light" };
        setSettings(updated);
        saveEditorSettings(updated);
      },
    },
    {
      id: "cmd-export",
      title: "Project: Export Project as JSON",
      category: "Project",
      icon: <Download className="w-4 h-4 text-neutral-400" />,
      action: () => {
        if (activeProject) exportProjectAsJSON(activeProject);
      },
    },
    {
      id: "cmd-initialize-framework",
      title: "Project: Initialize Framework / Add Tooling...",
      category: "Project",
      shortcut: "Ctrl+Shift+I",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => setIsInitializeDialogOpen(true),
    },
    {
      id: "cmd-restart-ts",
      title: "TypeScript: Restart Language Service & Refresh Diagnostics",
      category: "TypeScript",
      shortcut: "Ctrl+Shift+R",
      icon: <RefreshCw className="w-4 h-4 text-cyan-400" />,
      action: () => {
        if (activeProject) {
          setActiveProject({ ...activeProject, updatedAt: Date.now() });
          setConsoleMessages((prev) => [
            ...prev,
            {
              id: getEditorUniqueId("ts-restart"),
              type: "info",
              content: "✓ TypeScript Language Service restarted and workspace diagnostics refreshed.",
              timestamp: Date.now(),
            },
          ]);
        }
      },
    },
    {
      id: "cmd-reset",
      title: "Project: Reset to Template Defaults",
      category: "Project",
      icon: <RotateCcw className="w-4 h-4 text-rose-400" />,
      action: () => handleResetProject(),
    },
  ];

  if (!activeProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e1e] text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-ping" />
          <span>Initializing workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-neutral-300 font-sans overflow-hidden select-none">
      {/* Top Application Header Bar */}
      <header className="h-9 bg-[#1f1f1f] border-b border-[#2b2b2b] px-3 flex items-center justify-between text-xs select-none shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#2b2b2b] transition font-medium"
            title="Return to Projects Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Projects</span>
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="font-semibold text-white tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
            Code Editor
          </span>
          <span className="text-neutral-500">/</span>
          <button
            type="button"
            onClick={() => setIsProjectModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-white px-2 py-0.5 rounded hover:bg-[#2b2b2b] transition font-medium"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeProject.name}</span>
            <span className="text-[10px] text-neutral-400 font-mono">({activeProject.template})</span>
          </button>
        </div>

        {/* Center Quick Open Pill */}
        <div className="flex-1 max-w-sm mx-4">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between bg-[#141414] hover:bg-[#282828] border border-[#333333] px-3 py-1 rounded text-neutral-400 hover:text-neutral-200 transition text-xs font-mono"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Search className="w-3 h-3 text-neutral-500" />
              <span className="truncate">{activeProject.name} / {activeFile ? activeFile.name : "Search files..."}</span>
            </span>
            <kbd className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-400 border border-neutral-700">
              ⌘P
            </kbd>
          </button>
        </div>

        {/* Right Header Action Icons */}
        <div className="flex items-center gap-2">
          {/* Cloud Autosave Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161616] border border-[#2b2b2b] text-[11px] font-mono">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>Saved</span>
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-amber-300">
                <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved</span>
              </span>
            )}
            {saveStatus === "error" && (
              <button
                type="button"
                onClick={handleSaveActiveFile}
                className="flex items-center gap-1 text-rose-400 hover:underline cursor-pointer"
                title="Click to retry saving"
              >
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>Retry</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAIOpen((prev) => !prev)}
            title="Toggle AI Assistant"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              isAIOpen
                ? "bg-[#382b5f] text-[#c4b5fd]"
                : "text-neutral-300 hover:bg-[#2b2b2b] hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="hidden sm:inline">AI Agent</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen((prev) => !prev)}
            title="Toggle Live Preview"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              isPreviewOpen
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "bg-[#2b2b2b] text-neutral-200 hover:bg-[#383838] hover:text-white"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </header>

      {/* Main Body Layout: ActivityBar + Sidebar + Editor + SidePanels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Far-left Activity Bar */}
        <ActivityBar
          activeView={activeSidebarView}
          onSelectView={(view) => {
            setActiveSidebarView((prev) => (prev === view ? null : view));
          }}
          theme={settings.theme}
          onToggleTheme={() => {
            const next = settings.theme === "vs-dark" ? "light" : "vs-dark";
            const updated = { ...settings, theme: next as "vs-dark" | "light" };
            setSettings(updated);
            saveEditorSettings(updated);
          }}
          onOpenProjectModal={() => setIsProjectModalOpen(true)}
        />

        {/* Primary Sidebar Panel (Explorer, Search, Settings) */}
        {activeSidebarView && (
          <aside className="w-64 bg-[#252526] border-r border-[#1e1e1e] flex flex-col shrink-0 z-20 overflow-hidden">
            {activeSidebarView === "explorer" && (
              <FileExplorer
                project={activeProject}
                activeFileId={activeProject.activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onRenameFile={handleRenameFile}
                onDeleteFile={handleDeleteFile}
                onResetProject={handleResetProject}
                onOpenInitializeProject={() => setIsInitializeDialogOpen(true)}
              />
            )}

            {activeSidebarView === "search" && (
              <div className="h-full flex flex-col p-3 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-neutral-400 mb-2 text-[11px]">
                  Search across project
                </h4>
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search string in files..."
                    className="w-full bg-[#1e1e1e] border border-[#333333] px-2.5 py-1.5 rounded text-xs text-white outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {searchQuery.trim() ? (
                    activeProject.files
                      .filter((f) => !f.isFolder && f.content.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectFile(file.id)}
                          className="p-2 rounded bg-[#1e1e1e] hover:bg-[#2c2c2d] cursor-pointer transition"
                        >
                          <div className="font-medium text-white flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{file.name}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono mt-1 truncate">
                            {file.path}
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="text-neutral-500 italic p-2">Type text to search files.</div>
                  )}
                </div>
              </div>
            )}

            {activeSidebarView === "git" && (
              <GitPanel
                project={activeProject}
                unsavedFiles={unsavedFiles}
                onSelectFile={handleSelectFile}
                onCommitSuccess={(msg) => {
                  setConsoleMessages((prev) => [
                    ...prev,
                    {
                      id: getEditorUniqueId("git"),
                      type: "info",
                      content: `✓ Git Commit: "${msg}" recorded in repository.`,
                      timestamp: getTimestamp(),
                    },
                  ]);
                }}
              />
            )}

            {activeSidebarView === "debug" && (
              <DebugPanel
                project={activeProject}
                onExecuteCommand={(cmd) => {
                  setIsTerminalOpen(true);
                  setTerminalTab("terminal");
                  setConsoleMessages((prev) => [
                    ...prev,
                    {
                      id: getEditorUniqueId("dbg"),
                      type: "info",
                      content: `[Debug Runner]: Executing "${cmd}" in isolated workspace...`,
                      timestamp: getTimestamp(),
                    },
                  ]);
                }}
              />
            )}

            {activeSidebarView === "extensions" && <ExtensionsPanel />}

            {activeSidebarView === "settings" && (
              <div className="h-full flex flex-col p-3 text-xs space-y-4 overflow-y-auto">
                <h4 className="font-bold uppercase tracking-wider text-neutral-400 text-[11px]">
                  Editor Settings
                </h4>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium block">Font Size ({settings.fontSize}px)</label>
                  <input
                    type="range"
                    min="11"
                    max="22"
                    value={settings.fontSize}
                    onChange={(e) => {
                      const updated = { ...settings, fontSize: Number(e.target.value) };
                      setSettings(updated);
                      saveEditorSettings(updated);
                    }}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium block">Word Wrap</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = settings.wordWrap === "on" ? "off" : "on";
                      const updated = { ...settings, wordWrap: next as "on" | "off" };
                      setSettings(updated);
                      saveEditorSettings(updated);
                    }}
                    className="w-full py-1.5 bg-[#1e1e1e] border border-[#333333] rounded text-neutral-200 hover:text-white"
                  >
                    Wrap: {settings.wordWrap.toUpperCase()}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium block">Minimap</label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...settings, minimap: !settings.minimap };
                      setSettings(updated);
                      saveEditorSettings(updated);
                    }}
                    className="w-full py-1.5 bg-[#1e1e1e] border border-[#333333] rounded text-neutral-200 hover:text-white"
                  >
                    Minimap: {settings.minimap ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Center Main Editor Column + Bottom Terminal */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#1e1e1e]">
          {/* File Tabs */}
          <EditorTabs
            openFiles={openFiles}
            activeFileId={activeProject.activeFileId}
            unsavedFiles={unsavedFiles}
            onSelectTab={handleSelectFile}
            onCloseTab={handleCloseTab}
            onTogglePreview={() => setIsPreviewOpen((prev) => !prev)}
            isPreviewOpen={isPreviewOpen}
            onToggleAI={() => setIsAIOpen((prev) => !prev)}
            isAIOpen={isAIOpen}
          />

          {/* Monaco Editor Core Engine */}
          <div className="flex-1 overflow-hidden relative">
            <MonacoEditorComponent
              activeFile={activeFile}
              project={activeProject}
              settings={settings}
              onChange={handleContentChange}
              onSave={handleSaveActiveFile}
              onCursorChange={(line, column) => setCursorPos({ line, column })}
            />
          </div>

          {/* Bottom Integrated Terminal & Console Panel */}
          <TerminalPanel
            isOpen={isTerminalOpen}
            onToggle={() => setIsTerminalOpen(false)}
            activeTab={terminalTab}
            onSelectTab={(tab) => setTerminalTab(tab)}
            consoleMessages={consoleMessages}
            onClearConsole={() => setConsoleMessages([])}
            project={activeProject}
          />
        </main>

        {/* Right Side: Live Web Preview Panel */}
        {isPreviewOpen && (
          <div className="w-1/2 lg:w-[45%] flex shrink-0 border-l border-[#2b2b2b]">
            <PreviewPanel
              project={activeProject}
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              onConsoleMessage={handleConsoleMessage}
            />
          </div>
        )}

        {/* Right Side: AI Coding Assistant Panel */}
        {isAIOpen && (
          <div className="w-80 md:w-96 flex shrink-0 border-l border-[#2b2b2b]">
            <AIAssistantPanel
              project={activeProject}
              activeFile={activeFile}
              isOpen={isAIOpen}
              onClose={() => setIsAIOpen(false)}
              onApplyDiff={handleApplyDiff}
            />
          </div>
        )}
      </div>

      {/* IDE Bottom Status Bar */}
      <StatusBar
        activeFile={activeFile}
        cursorPos={cursorPos}
        onToggleTerminal={() => setIsTerminalOpen((prev) => !prev)}
        isTerminalOpen={isTerminalOpen}
        saveStatus={saveStatus}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        project={activeProject}
        onSelectFile={handleSelectFile}
        commands={commandList}
      />

      {/* Project Switcher Modal */}
      {isProjectModalOpen && (
        <div
          onClick={() => setIsProjectModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#252526] border border-[#3c3c3c] rounded-xl shadow-2xl p-5 text-neutral-300 font-sans space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-amber-400" />
                <span>Project Management</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                Framework Setup & Tooling:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsProjectModalOpen(false);
                  setIsInitializeDialogOpen(true);
                }}
                className="w-full p-3 rounded-xl bg-[#1e1e1e] hover:bg-[#2c2c2e] border border-amber-500/30 hover:border-amber-500/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs">Initialize Framework / Add Tooling</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Configure Next.js, React, Node, or add shadcn/ui components
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                Switch Starter Template:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchTemplate("react-ts")}
                  className="p-3 rounded-lg bg-[#1e1e1e] hover:bg-[#2c2c2e] border border-[#333333] text-left transition"
                >
                  <div className="font-semibold text-white text-xs">React + TypeScript</div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    Vite-ready component tree, counter, task list
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchTemplate("vanilla-web")}
                  className="p-3 rounded-lg bg-[#1e1e1e] hover:bg-[#2c2c2e] border border-[#333333] text-left transition"
                >
                  <div className="font-semibold text-white text-xs">Vanilla Web</div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    HTML5, modern CSS gradients, interactive JS
                  </div>
                </button>
              </div>
            </div>

            {/* Export & Reset Actions */}
            <div className="pt-2 border-t border-[#333333] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => exportProjectAsJSON(activeProject)}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded bg-[#1e1e1e] hover:bg-[#2c2c2e] text-neutral-200 border border-[#333333]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleResetProject();
                  setIsProjectModalOpen(false);
                }}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Files</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initialize Framework / Tooling Setup Dialog */}
      {activeProject && (
        <InitializeProjectDialog
          isOpen={isInitializeDialogOpen}
          onClose={() => setIsInitializeDialogOpen(false)}
          project={activeProject}
          onInitialized={(updatedProject) => {
            setActiveProject(updatedProject);
            setProjects((prev) =>
              prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
            );
          }}
        />
      )}
    </div>
  );
}
