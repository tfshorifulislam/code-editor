"use client";

import React, { useState } from "react";
import {
  Blocks,
  Search,
  Star,
} from "lucide-react";
import { ExtensionItem } from "@/types/editor";

export default function ExtensionsPanel() {
  const [search, setSearch] = useState("");
  const [extensions, setExtensions] = useState<ExtensionItem[]>([
    {
      id: "ms-python.python",
      name: "python",
      displayName: "Python",
      description: "IntelliSense, linting, debugging, code formatting for Python 3.",
      publisher: "Microsoft",
      version: "2024.4.1",
      downloads: "128M",
      rating: 4.8,
      installed: true,
      category: "Language",
    },
    {
      id: "esbenp.prettier-vscode",
      name: "prettier-vscode",
      displayName: "Prettier - Code Formatter",
      description: "Code formatter using Prettier supporting TS, JS, CSS, JSON, HTML.",
      publisher: "Prettier",
      version: "10.1.0",
      downloads: "42M",
      rating: 4.7,
      installed: true,
      category: "Formatters",
    },
    {
      id: "dbaeumer.vscode-eslint",
      name: "vscode-eslint",
      displayName: "ESLint",
      description: "Integrates ESLint JavaScript and TypeScript into VS Code.",
      publisher: "Microsoft",
      version: "3.0.8",
      downloads: "35M",
      rating: 4.6,
      installed: true,
      category: "Linters",
    },
    {
      id: "bradlc.vscode-tailwindcss",
      name: "vscode-tailwindcss",
      displayName: "Tailwind CSS IntelliSense",
      description: "Intelligent Tailwind CSS tooling for VS Code with autocompletion.",
      publisher: "Tailwind Labs",
      version: "0.10.5",
      downloads: "18M",
      rating: 4.9,
      installed: false,
      category: "Tools",
    },
    {
      id: "rust-lang.rust-analyzer",
      name: "rust-analyzer",
      displayName: "rust-analyzer",
      description: "Rust language support with completion, diagnostics, and refactoring.",
      publisher: "Rust",
      version: "0.4.1912",
      downloads: "8.5M",
      rating: 4.9,
      installed: false,
      category: "Language",
    },
    {
      id: "golang.go",
      name: "go",
      displayName: "Go",
      description: "Rich language support for Go programming language and modules.",
      publisher: "Go Team at Google",
      version: "0.41.2",
      downloads: "14M",
      rating: 4.8,
      installed: false,
      category: "Language",
    },
    {
      id: "ms-vscode.cpptools",
      name: "cpptools",
      displayName: "C/C++",
      description: "C/C++ IntelliSense, debugging, and code browsing.",
      publisher: "Microsoft",
      version: "1.19.9",
      downloads: "64M",
      rating: 4.5,
      installed: false,
      category: "Language",
    },
  ]);

  const toggleInstall = (id: string) => {
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === id ? { ...ext, installed: !ext.installed } : ext))
    );
  };

  const filtered = extensions.filter(
    (e) =>
      e.displayName.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.publisher.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#252526] text-neutral-300 font-sans text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#1e1e1e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Blocks className="w-4 h-4 text-purple-400" />
          <span className="font-bold uppercase tracking-wider text-[11px] text-neutral-300">
            Extensions: Marketplace
          </span>
        </div>
        <span className="text-[10px] text-neutral-400 font-mono">Open VSX Compatible</span>
      </div>

      <div className="p-3 border-b border-[#1e1e1e]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Extensions in Marketplace..."
            className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-[var(--color-primary)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.map((ext) => (
          <div
            key={ext.id}
            className="p-2.5 rounded-xl bg-[#1e1e1e]/60 hover:bg-[#1e1e1e] border border-transparent hover:border-[#383838] transition space-y-2 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-white text-xs truncate flex items-center gap-1.5">
                  <span>{ext.displayName}</span>
                  {ext.installed && (
                    <span className="text-[9px] bg-purple-500/20 text-[#c4b5fd] px-1.5 py-0.2 rounded font-mono">
                      Installed
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {ext.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleInstall(ext.id)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition shrink-0 cursor-pointer ${
                  ext.installed
                    ? "bg-[#2b2b2b] text-neutral-300 hover:bg-rose-950 hover:text-rose-300"
                    : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs"
                }`}
              >
                {ext.installed ? "Disable" : "Install"}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-[#2a2a2a] font-mono">
              <span>{ext.publisher} • v{ext.version}</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {ext.rating}
                </span>
                <span>{ext.downloads}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
