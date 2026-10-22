"use client";

import React from "react";
import { GitBranch, Sparkles, Check } from "lucide-react";
import { ProjectFile } from "@/types/editor";

interface StatusBarProps {
  activeFile: ProjectFile | null;
  cursorPos: { line: number; column: number };
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
}

export default function StatusBar({
  activeFile,
  cursorPos,
  onToggleTerminal,
  isTerminalOpen,
}: StatusBarProps) {
  const getLanguageLabel = (file: ProjectFile | null): string => {
    if (!file) return "Plain Text";
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "tsx":
        return "TypeScript React";
      case "ts":
        return "TypeScript";
      case "jsx":
        return "JavaScript React";
      case "js":
        return "JavaScript";
      case "html":
        return "HTML";
      case "css":
        return "CSS";
      case "json":
        return "JSON";
      case "md":
        return "Markdown";
      case "py":
        return "Python";
      default:
        return "Plain Text";
    }
  };

  return (
    <footer className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] font-mono select-none z-30 shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 hover:bg-black/10 px-1.5 py-0.5 rounded cursor-pointer transition">
          <GitBranch className="w-3 h-3" />
          <span>main*</span>
        </div>

        <button
          type="button"
          onClick={onToggleTerminal}
          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer transition ${
            isTerminalOpen ? "bg-black/25 text-white" : "hover:bg-black/10 text-white/90"
          }`}
          title={isTerminalOpen ? "Hide Terminal Drawer" : "Show Terminal Drawer"}
        >
          <span>0 ⊗</span>
          <span>0 ⚠</span>
        </button>

        <span className="hidden sm:inline text-white/50">•</span>
        <span className="hidden sm:inline text-white/80">Code Editor v1.0</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">
          Ln {cursorPos.line}, Col {cursorPos.column}
        </span>
        <span className="hidden md:inline">Spaces: 2</span>
        <span>UTF-8</span>
        <span className="hover:bg-black/10 px-1 py-0.5 rounded cursor-pointer font-sans font-medium">
          {getLanguageLabel(activeFile)}
        </span>
        <div className="hidden sm:flex items-center gap-1 text-emerald-200">
          <Check className="w-3 h-3 stroke-[2.5]" />
          <span>Prettier</span>
        </div>
        <div className="flex items-center gap-1 text-purple-200">
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">AI Active</span>
        </div>
      </div>
    </footer>
  );
}
