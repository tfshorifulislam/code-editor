import React from "react";
import type { Metadata } from "next";
import EditorLayout from "@/components/Editor/EditorLayout";

export const metadata: Metadata = {
  title: "IDE Workspace — Code Editor",
  description:
    "Browser-based coding workspace with Monaco Editor, live web preview, and an intelligent AI coding assistant.",
};

export default function EditorPage() {
  return <EditorLayout />;
}

