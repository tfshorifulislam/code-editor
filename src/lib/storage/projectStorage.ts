import { Project, ProjectFile, ProjectTemplate, EditorSettings } from "@/types/editor";

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: "vs-dark",
  fontSize: 14,
  wordWrap: "on",
  minimap: true,
  autoSave: true,
  tabSize: 2,
};

export const STARTER_REACT_TS_FILES: ProjectFile[] = [
  {
    id: "f-root-src",
    name: "src",
    path: "src",
    content: "",
    language: "",
    isFolder: true,
    parentId: null,
  },
  {
    id: "f-app-tsx",
    name: "App.tsx",
    path: "src/App.tsx",
    content: `import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState([
    { id: 1, text: "Build with Code Editor", done: true },
    { id: 2, text: "Explore AI Assistant features", done: false },
    { id: 3, text: "Deploy modern web app", done: false },
  ]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo.trim(), done: false }]);
    setNewTodo("");
    console.log("Added new task:", newTodo);
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "640px", margin: "0 auto", color: "#1f2937" }}>
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ display: "inline-block", background: "#f3f0ff", color: "#6c5ce7", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          ✦ Running in Code Editor
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "#111827" }}>
          Interactive React Project
        </h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
          Edit <code>src/App.tsx</code> and see instant live updates in preview!
        </p>
      </header>

      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", margin: "0 0 1rem 0" }}>Interactive Counter</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button 
            onClick={() => setCount(c => c - 1)}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontWeight: 600 }}
          >
            -
          </button>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, minWidth: "3rem", textAlign: "center" }}>
            {count}
          </span>
          <button 
            onClick={() => setCount(c => c + 1)}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", background: "#6c5ce7", color: "#fff", cursor: "pointer", fontWeight: 600 }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "1.2rem", margin: "0 0 1rem 0" }}>Project Tasks</h2>
        <form onSubmit={addTodo} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input 
            type="text" 
            value={newTodo} 
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add new task..." 
            style={{ flex: 1, padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }}
          />
          <button type="submit" style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "#6c5ce7", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Add
          </button>
        </form>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {todos.map(todo => (
            <li 
              key={todo.id} 
              onClick={() => toggleTodo(todo.id)}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "6px", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}
            >
              <input type="checkbox" checked={todo.done} readOnly style={{ cursor: "pointer" }} />
              <span style={{ textDecoration: todo.done ? "line-through" : "none", color: todo.done ? "#9ca3af" : "#111827" }}>
                {todo.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}`,
    language: "typescript",
    isFolder: false,
    parentId: "f-root-src",
  },
  {
    id: "f-index-tsx",
    name: "index.tsx",
    path: "src/index.tsx",
    content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}`,
    language: "typescript",
    isFolder: false,
    parentId: "f-root-src",
  },
  {
    id: "f-styles-css",
    name: "styles.css",
    path: "src/styles.css",
    content: `/* Global styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
}

code {
  background: #f1f5f9;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  font-family: monospace;
}`,
    language: "css",
    isFolder: false,
    parentId: "f-root-src",
  },
  {
    id: "f-index-html",
    name: "index.html",
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    language: "html",
    isFolder: false,
    parentId: null,
  },
  {
    id: "f-package-json",
    name: "package.json",
    path: "package.json",
    content: `{
  "name": "react-code-editor-project",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}`,
    language: "json",
    isFolder: false,
    parentId: null,
  },
];

export const STARTER_VANILLA_FILES: ProjectFile[] = [
  {
    id: "v-index-html",
    name: "index.html",
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Web App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="card">
    <div class="badge">✦ Browser Workspace</div>
    <h1>Hello, Code Editor!</h1>
    <p>This is a live vanilla JavaScript, HTML, and CSS web project.</p>
    
    <div class="counter-box">
      <button id="btn-minus">-</button>
      <span id="counter-value">0</span>
      <button id="btn-plus">+</button>
    </div>

    <div class="input-row">
      <input type="text" id="log-input" placeholder="Type a message for the console...">
      <button id="btn-log">Send to Console</button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    language: "html",
    isFolder: false,
    parentId: null,
  },
  {
    id: "v-styles-css",
    name: "styles.css",
    path: "styles.css",
    content: `body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  padding: 1rem;
}

.card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  max-width: 440px;
  width: 100%;
  text-align: center;
}

.badge {
  display: inline-block;
  background: #f3f0ff;
  color: #6c5ce7;
  padding: 0.3rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.8rem;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
}

p {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.8rem;
}

.counter-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}

button {
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.9;
}

#btn-minus {
  background: #e2e8f0;
  color: #1e293b;
}

#counter-value {
  font-size: 1.8rem;
  font-weight: 700;
  min-width: 2.5rem;
}

.input-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
}`,
    language: "css",
    isFolder: false,
    parentId: null,
  },
  {
    id: "v-app-js",
    name: "app.js",
    path: "app.js",
    content: `// Client-side interactions
let count = 0;
const counterVal = document.getElementById("counter-value");
const btnPlus = document.getElementById("btn-plus");
const btnMinus = document.getElementById("btn-minus");
const btnLog = document.getElementById("btn-log");
const logInput = document.getElementById("log-input");

btnPlus.addEventListener("click", () => {
  count++;
  counterVal.textContent = count;
  console.log("Count incremented to:", count);
});

btnMinus.addEventListener("click", () => {
  count--;
  counterVal.textContent = count;
  console.log("Count decremented to:", count);
});

btnLog.addEventListener("click", () => {
  const msg = logInput.value.trim();
  if (msg) {
    console.log("[User Log]:", msg);
    logInput.value = "";
  }
});

console.log("Application initialized successfully in browser workspace!");`,
    language: "javascript",
    isFolder: false,
    parentId: null,
  },
  {
    id: "v-readme-md",
    name: "README.md",
    path: "README.md",
    content: `# Modern Web App Starter

This project demonstrates live web development in Code Editor.

## How to use:
1. Edit \`index.html\`, \`styles.css\`, or \`app.js\`.
2. Notice real-time live preview on the right.
3. Open the Terminal/Output drawer to inspect \`console.log\` output.
4. Use the AI Assistant to ask questions, refactor, or generate code.
`,
    language: "markdown",
    isFolder: false,
    parentId: null,
  },
];

export function createStarterProject(
  template: ProjectTemplate = "react-ts",
  name?: string
): Project {
  const isReact = template === "react-ts";
  const files = isReact ? STARTER_REACT_TS_FILES : STARTER_VANILLA_FILES;
  const activeFileId = isReact ? "f-app-tsx" : "v-index-html";
  const openFileIds = isReact
    ? ["f-app-tsx", "f-styles-css", "f-package-json"]
    : ["v-index-html", "v-styles-css", "v-app-js"];

  return {
    id: `proj-${Date.now()}`,
    name: name || (isReact ? "My React App" : "My Web Project"),
    template,
    files,
    activeFileId,
    openFileIds,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const STORAGE_KEY_PROJECTS = "code_editor_projects_v1";
const STORAGE_KEY_ACTIVE_PROJECT = "code_editor_active_project_id_v1";
const STORAGE_KEY_SETTINGS = "code_editor_settings_v1";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load projects from localStorage", err);
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.error("Failed to save projects to localStorage", err);
  }
}

export function loadActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT);
}

export function saveActiveProjectId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, id);
}

export function loadEditorSettings(): EditorSettings {
  if (typeof window === "undefined") return DEFAULT_EDITOR_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_EDITOR_SETTINGS;
    return { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_EDITOR_SETTINGS;
  }
}

export function saveEditorSettings(settings: EditorSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings", err);
  }
}

export function exportProjectAsJSON(project: Project): void {
  if (typeof window === "undefined") return;
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `${project.name.toLowerCase().replace(/\s+/g, "-")}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

