"use client";

import React from "react";
import { FolderCode, Star, Trash2, Search, Plus } from "lucide-react";
import { DashboardViewCategory } from "./ProjectsSidebar";

interface ProjectEmptyStateProps {
  category: DashboardViewCategory;
  isSearchActive: boolean;
  onOpenNewProject: () => void;
  onClearSearch?: () => void;
}

export default function ProjectEmptyState({
  category,
  isSearchActive,
  onOpenNewProject,
  onClearSearch,
}: ProjectEmptyStateProps) {
  if (isSearchActive) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center select-none bg-white rounded-2xl border border-dashed border-[#d1d1d6] my-6">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#171717]">No Matching Projects</h3>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">
          We couldn&apos;t find any projects matching your search query.
        </p>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-4 px-4 py-1.5 rounded-lg border border-[#eaeaea] hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition cursor-pointer"
          >
            Clear Search Filter
          </button>
        )}
      </div>
    );
  }

  if (category === "starred") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center select-none bg-white rounded-2xl border border-dashed border-[#d1d1d6] my-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
          <Star className="w-6 h-6 fill-amber-500/20" />
        </div>
        <h3 className="text-sm font-bold text-[#171717]">No Starred Projects</h3>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">
          Star your favorite workspaces to pin them to this view for rapid access.
        </p>
      </div>
    );
  }

  if (category === "trash") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center select-none bg-white rounded-2xl border border-dashed border-[#d1d1d6] my-6">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#171717]">Trash Bin is Empty</h3>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">
          Projects moved to trash will appear here and can be restored anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-14 text-center select-none bg-white rounded-2xl border border-dashed border-[#d1d1d6] my-6">
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3.5 shadow-xs">
        <FolderCode className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-[#171717]">Create your first project</h3>
      <p className="text-xs text-neutral-500 max-w-sm mt-1.5 leading-relaxed">
        Get started with React + TypeScript, Vanilla Web, Next.js, or a blank workspace with live preview and AI assistance.
      </p>
      <button
        type="button"
        onClick={onOpenNewProject}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Create Project</span>
      </button>
    </div>
  );
}

