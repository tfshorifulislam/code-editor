"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RotateCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  X,
  Loader2,
} from "lucide-react";
import { Project } from "@/types/editor";
import { generatePreviewHtml } from "@/lib/runtime/previewCompiler";

interface PreviewPanelProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onConsoleMessage?: (type: "log" | "error" | "warn" | "info", text: string) => void;
  refreshTrigger?: number;
}

export default function PreviewPanel({
  project,
  isOpen,
  onClose,
  onConsoleMessage,
  refreshTrigger = 0,
}: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Compute live preview URL if this is a stored project
  const isCloudProject = Boolean(project.id && !project.id.startsWith("temp_"));
  const previewUrl = isCloudProject
    ? `/api/projects/${encodeURIComponent(project.id)}/preview?t=${refreshKey}_${refreshTrigger}`
    : undefined;

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
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(`/api/projects/${encodeURIComponent(project.id)}/preview`, "_blank");
    } else {
      const fallbackHtml = generatePreviewHtml(project);
      const blob = new Blob([fallbackHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
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
            title="Reload preview (F5)"
            className="p-1 hover:text-white rounded hover:bg-[#333333] transition cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" />
            ) : (
              <RotateCw className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="flex-1 flex items-center bg-[#1e1e1e] border border-[#333333] px-2.5 py-1 rounded-md text-[11px] font-mono text-neutral-400">
            <span className="text-emerald-400 mr-1.5">●</span>
            <span className="text-neutral-200 truncate">http://localhost:3000</span>
            <span className="ml-auto text-[9px] bg-emerald-950/80 text-emerald-300 px-1 py-0.2 rounded border border-emerald-800/40 shrink-0">
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
            className={`p-1 rounded transition cursor-pointer ${
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
            className={`p-1 rounded transition cursor-pointer ${
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
            className={`p-1 rounded transition cursor-pointer ${
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
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              key={`${refreshKey}-${refreshTrigger}`}
              src={previewUrl}
              onLoad={() => setIsLoading(false)}
              title="Project Live Preview"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <iframe
              ref={iframeRef}
              key={`srcdoc-${refreshKey}-${refreshTrigger}`}
              srcDoc={generatePreviewHtml(project)}
              onLoad={() => setIsLoading(false)}
              title="Project Live Preview"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
