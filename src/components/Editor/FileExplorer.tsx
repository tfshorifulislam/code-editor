"use client";

import React, { useState, type MouseEvent } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  Plus,
  FolderPlus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Project, ProjectFile } from "@/types/editor";

interface FileExplorerProps {
  project: Project;
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string, isFolder: boolean, parentId: string | null) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onResetProject: () => void;
  onOpenInitializeProject?: () => void;
}

export default function FileExplorer({
  project,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onResetProject,
  onOpenInitializeProject,
}: FileExplorerProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState<{ isFolder: boolean; parentId: string | null } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const toggleFolder = (id: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startCreate = (isFolder: boolean, parentId: string | null = null) => {
    setIsCreating({ isFolder, parentId });
    setNewItemName("");
    if (parentId && collapsedFolders[parentId]) {
      setCollapsedFolders((prev) => ({ ...prev, [parentId]: false }));
    }
  };

  const submitCreate = () => {
    if (!newItemName.trim() || !isCreating) {
      setIsCreating(null);
      return;
    }
    onCreateFile(newItemName.trim(), isCreating.isFolder, isCreating.parentId);
    setIsCreating(null);
    setNewItemName("");
  };

  const startRename = (file: ProjectFile, e: MouseEvent) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setEditingName(file.name);
  };

  const submitRename = () => {
    if (editingFileId && editingName.trim()) {
      onRenameFile(editingFileId, editingName.trim());
    }
    setEditingFileId(null);
  };

  const confirmDelete = (file: ProjectFile, e: MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete ${file.isFolder ? "folder" : "file"} "${file.name}"?`);
    if (confirmed) {
      onDeleteFile(file.id);
    }
  };

  const renderFileIcon = (file: ProjectFile) => {
    if (file.isFolder) {
      const isCollapsed = collapsedFolders[file.id];
      return isCollapsed ? (
        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "tsx":
      case "jsx":
        return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
      case "ts":
      case "js":
        return <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />;
      case "css":
        return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
      case "html":
        return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
      case "json":
        return <FileJson className="w-4 h-4 text-amber-300 shrink-0" />;
      case "md":
        return <FileText className="w-4 h-4 text-neutral-400 shrink-0" />;
      case "py":
        return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-neutral-400 shrink-0" />;
    }
  };

  // Build recursive or hierarchical tree
  const rootFiles = project.files.filter((f) => f.parentId === null);
  const getChildFiles = (parentId: string) => project.files.filter((f) => f.parentId === parentId);

  const renderItem = (item: ProjectFile, level: number = 0) => {
    const isFolder = item.isFolder;
    const isCollapsed = collapsedFolders[item.id];
    const isActive = activeFileId === item.id;
    const children = isFolder ? getChildFiles(item.id) : [];

    return (
      <div key={item.id} className="select-none">
        <div
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.id);
            } else {
              onSelectFile(item.id);
            }
          }}
          style={{ paddingLeft: `${Math.max(level * 14 + 10, 10)}px` }}
          className={`group flex items-center justify-between py-1 pr-2 text-xs font-mono rounded cursor-pointer transition-colors ${
            isActive
              ? "bg-[#37373d] text-white font-medium"
              : "text-neutral-300 hover:bg-[#2a2d2e] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isFolder && (
              <span className="text-neutral-500">
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            )}
            {!isFolder && <span className="w-3.5" />}
            {renderFileIcon(item)}

            {editingFileId === item.id ? (
              <input
                type="text"
                value={editingName}
                autoFocus
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={submitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") setEditingFileId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1e1e1e] text-white border border-[var(--color-primary)] px-1 py-0.5 rounded text-xs outline-none w-full"
              />
            ) : (
              <span className="truncate">{item.name}</span>
            )}
          </div>

          {/* Action buttons on hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
            {isFolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startCreate(false, item.id);
                }}
                title="New file in folder"
                className="p-1 hover:text-white text-neutral-400"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => startRename(item, e)}
              title="Rename"
              className="p-1 hover:text-white text-neutral-400"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => confirmDelete(item, e)}
              title="Delete"
              className="p-1 hover:text-rose-400 text-neutral-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Children for expanded folders */}
        {isFolder && !isCollapsed && (
          <div>
            {isCreating && isCreating.parentId === item.id && renderNewItemInput(level + 1)}
            {children.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderNewItemInput = (level: number = 0) => (
    <div
      style={{ paddingLeft: `${level * 14 + 10}px` }}
      className="flex items-center gap-2 py-1 pr-2 bg-[#252526]"
    >
      {isCreating?.isFolder ? (
        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <File className="w-4 h-4 text-neutral-400 shrink-0" />
      )}
      <input
        type="text"
        autoFocus
        value={newItemName}
        placeholder={isCreating?.isFolder ? "Folder name..." : "File name..."}
        onChange={(e) => setNewItemName(e.target.value)}
        onBlur={submitCreate}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitCreate();
          if (e.key === "Escape") setIsCreating(null);
        }}
        className="bg-[#1e1e1e] text-white border border-[var(--color-primary)] px-1.5 py-0.5 rounded text-xs outline-none w-full font-mono"
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#252526] select-none text-neutral-300">
      {/* Explorer Header */}
      <div className="h-9 px-3 border-b border-[#333333] flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400">
        <span className="truncate">{project.name}</span>
        <div className="flex items-center gap-1">
          {onOpenInitializeProject && (
            <button
              type="button"
              onClick={onOpenInitializeProject}
              title="Initialize Framework / Add Tooling"
              className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer text-amber-400 hover:text-amber-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => startCreate(false, null)}
            title="New File"
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => startCreate(true, null)}
            title="New Folder"
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetProject}
            title="Reset Project Files"
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-1">
        {isCreating && isCreating.parentId === null && renderNewItemInput(0)}
        {rootFiles.map((file) => renderItem(file, 0))}

        {project.files.length === 0 && (
          <div className="p-4 text-center space-y-3.5 select-none">
            <div className="w-10 h-10 rounded-xl bg-[#2a2d2e] border border-[#3c3c3c] flex items-center justify-center mx-auto text-neutral-400">
              <FolderPlus className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-neutral-200">Empty Workspace</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed px-1">
                This project has no files yet. Create files or initialize a framework.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => startCreate(false, null)}
                className="w-full py-1.5 px-3 bg-[#333333] hover:bg-[#3c3c3c] text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New File</span>
              </button>
              <button
                type="button"
                onClick={() => startCreate(true, null)}
                className="w-full py-1.5 px-3 bg-[#2a2d2e] hover:bg-[#333333] text-neutral-300 hover:text-white rounded text-xs font-medium flex items-center justify-center gap-2 border border-[#3c3c3c] transition cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Folder</span>
              </button>
              {onOpenInitializeProject && (
                <button
                  type="button"
                  onClick={onOpenInitializeProject}
                  className="w-full py-1.5 px-3 bg-[var(--color-primary)] hover:opacity-90 text-white rounded text-xs font-medium flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Initialize Framework</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

