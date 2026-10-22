export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "html"
  | "css"
  | "json"
  | "markdown"
  | "python";

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: SupportedLanguage | string;
  isFolder: boolean;
  parentId: string | null;
}

export type ProjectTemplate =
  | "react-ts"
  | "vanilla-web"
  | "next-app"
  | "node-api"
  | "blank";

export interface Project {
  id: string;
  name: string;
  template: ProjectTemplate;
  description?: string;
  files: ProjectFile[];
  activeFileId: string | null;
  openFileIds: string[];
  starred?: boolean;
  isTrash?: boolean;
  trashedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface EditorSettings {
  theme: "vs-dark" | "light";
  fontSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
  autoSave: boolean;
  tabSize: number;
}

export interface ConsoleMessage {
  id: string;
  type: "log" | "error" | "warn" | "info" | "system";
  content: string;
  timestamp: number;
}

export interface AIDiffChange {
  id: string;
  fileId: string;
  filePath: string;
  originalContent: string;
  newContent: string;
  summary: string;
  status: "pending" | "accepted" | "rejected";
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  proposedDiffs?: AIDiffChange[];
}

export type SidebarView =
  | "explorer"
  | "search"
  | "source-control"
  | "ai"
  | "settings";

export type BottomTab = "terminal" | "output" | "problems";
