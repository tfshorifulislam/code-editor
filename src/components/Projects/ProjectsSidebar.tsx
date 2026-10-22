"use client";

import React from "react";
import Link from "next/link";
import {
  Code2,
  FolderKanban,
  Clock,
  Star,
  LayoutTemplate,
  Trash2,
  Plus,
  Settings,
  User,
  ArrowLeft,
} from "lucide-react";

export type DashboardViewCategory =
  | "all"
  | "recent"
  | "starred"
  | "templates"
  | "trash";

interface ProjectsSidebarProps {
  currentCategory: DashboardViewCategory;
  onSelectCategory: (category: DashboardViewCategory) => void;
  onOpenNewProject: () => void;
  counts: {
    all: number;
    recent: number;
    starred: number;
    trash: number;
  };
}

export default function ProjectsSidebar({
  currentCategory,
  onSelectCategory,
  onOpenNewProject,
  counts,
}: ProjectsSidebarProps) {
  const navItems = [
    {
      id: "all" as DashboardViewCategory,
      label: "All Projects",
      icon: <FolderKanban className="w-4 h-4" />,
      count: counts.all,
    },
    {
      id: "recent" as DashboardViewCategory,
      label: "Recent",
      icon: <Clock className="w-4 h-4" />,
      count: counts.recent,
    },
    {
      id: "starred" as DashboardViewCategory,
      label: "Starred",
      icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />,
      count: counts.starred,
    },
    {
      id: "templates" as DashboardViewCategory,
      label: "Templates",
      icon: <LayoutTemplate className="w-4 h-4 text-purple-400" />,
      count: 5,
    },
    {
      id: "trash" as DashboardViewCategory,
      label: "Trash",
      icon: <Trash2 className="w-4 h-4" />,
      count: counts.trash,
    },
  ];

  return (
    <aside className="w-64 bg-[#fbfbfb] border-r border-[#eaeaea] flex flex-col justify-between h-screen select-none shrink-0 font-sans">
      {/* Top Section */}
      <div className="p-4 space-y-4">
        {/* Brand Logo & Back to Marketing Site */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            title="Back to Landing Page"
            className="flex items-center gap-2.5 group focus-visible:outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Code2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-[#171717]">
              Code Editor
            </span>
          </Link>

          <Link
            href="/"
            title="Landing Home"
            className="text-xs text-neutral-400 hover:text-neutral-700 flex items-center gap-1 p-1 rounded hover:bg-neutral-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        {/* Primary "+ New Project" Button */}
        <button
          type="button"
          onClick={onOpenNewProject}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>New Project</span>
        </button>

        {/* Navigation Categories */}
        <nav className="space-y-1 pt-2">
          {navItems.map((item) => {
            const isActive = currentCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCategory(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-[#ede9fe] text-[var(--color-primary)] font-semibold"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white font-bold"
                        : "bg-neutral-200/80 text-neutral-500"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-[#eaeaea] bg-white">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-900 truncate">
                Developer Workspace
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">
                Local-first • Free Tier
              </div>
            </div>
          </div>
          <Settings className="w-4 h-4 text-neutral-400 hover:text-neutral-700 shrink-0" />
        </div>
      </div>
    </aside>
  );
}

