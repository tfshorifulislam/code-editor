"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  RotateCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  X,
} from "lucide-react";
import { Project } from "@/types/editor";
import { generatePreviewHtml } from "@/lib/runtime/previewCompiler";

interface PreviewPanelProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onConsoleMessage?: (type: "log" | "error" | "warn" | "info", text: string) => void;
}

export default function PreviewPanel({
  project,
  isOpen,
  onClose,
  onConsoleMessage,
}: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate preview whenever project files change or user refreshes
  const previewHtml = useMemo(() => {
    return generatePreviewHtml(project);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, key]);

  // Listen for console bridge messages from the iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "PREVIEW_CONSOLE" && onConsoleMessage) {
        onConsoleMessage(e.data.level || "log", e.data.text || "");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsoleMessage]);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  const getContainerWidth = () => {
    switch (deviceMode) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "desktop":
      default:
        return "100%";
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#2b2b2b] select-none z-10 w-full min-w-[320px]">
      {/* Top Address & Controls Bar */}
      <div className="h-10 bg-[#252526] border-b border-[#1e1e1e] px-3 flex items-center justify-between text-xs text-neutral-300 gap-2">
        {/* Left: Refresh + Address bar */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <button
            type="button"
            onClick={handleRefresh}
            title="Reload preview"
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 flex items-center bg-[#1e1e1e] border border-[#333333] px-2.5 py-1 rounded-md text-[11px] font-mono text-neutral-400">
            <span className="text-emerald-400 mr-1.5">●</span>
            <span className="text-neutral-200">http://localhost:3000</span>
            <span className="ml-auto text-[9px] bg-emerald-950/80 text-emerald-300 px-1 py-0.2 rounded border border-emerald-800/40">
              Live
            </span>
          </div>
        </div>

        {/* Center: Device Viewport Switches */}
        <div className="hidden sm:flex items-center bg-[#1e1e1e] p-0.5 rounded border border-[#333333]">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            title="Desktop view"
            className={`p-1 rounded transition ${
              deviceMode === "desktop"
                ? "bg-[var(--color-primary)] text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("tablet")}
            title="Tablet view (768px)"
            className={`p-1 rounded transition ${
              deviceMode === "tablet"
                ? "bg-[var(--color-primary)] text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            title="Mobile view (375px)"
            className={`p-1 rounded transition ${
              deviceMode === "mobile"
                ? "bg-[var(--color-primary)] text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleOpenExternal}
            title="Open in new window"
            className="p-1.5 hover:text-white text-neutral-400 rounded hover:bg-[#333333] transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Preview panel"
            className="p-1.5 hover:text-white text-neutral-400 rounded hover:bg-[#333333] transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rendered Viewport Sandbox */}
      <div className="flex-1 bg-[#121212] flex items-center justify-center p-2 overflow-auto">
        <div
          style={{ width: getContainerWidth() }}
          className={`h-full bg-white transition-all overflow-hidden ${
            deviceMode !== "desktop"
              ? "rounded-xl shadow-2xl border-4 border-neutral-700"
              : ""
          }`}
        >
          <iframe
            ref={iframeRef}
            key={key}
            srcDoc={previewHtml}
            title="Project Live Preview"
            sandbox="allow-scripts allow-modals allow-forms"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
