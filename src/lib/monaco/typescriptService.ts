import type * as Monaco from "monaco-editor";
import { Project } from "@/types/editor";

let extraLibDisposables: Monaco.IDisposable[] = [];

/**
 * Standard ambient TypeScript declarations for React, Next.js, Lucide, Radix, and utility libraries.
 * These provide the Monaco Editor TypeScript worker with full type-checking capabilities.
 */
const AMBIENT_DECLARATIONS = `
// --- React 19 & JSX Runtime ---
declare namespace JSX {
  interface Element {
    type: any;
    props: any;
    key: any;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
    div: any;
    span: any;
    p: any;
    h1: any;
    h2: any;
    h3: any;
    h4: any;
    h5: any;
    h6: any;
    main: any;
    section: any;
    article: any;
    header: any;
    footer: any;
    nav: any;
    aside: any;
    button: any;
    input: any;
    textarea: any;
    select: any;
    option: any;
    label: any;
    form: any;
    a: any;
    img: any;
    ul: any;
    ol: any;
    li: any;
    code: any;
    pre: any;
    svg: any;
    path: any;
    kbd: any;
    strong: any;
    em: any;
    b: any;
    i: any;
  }
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react" {
  export type ReactNode = any;
  export type ReactElement = any;
  export type FC<P = {}> = (props: P) => ReactElement | null;
  export type ComponentProps<T> = any;

  export interface HTMLAttributes<T> {
    className?: string;
    style?: any;
    children?: ReactNode;
    id?: string;
    onClick?: (e: any) => void;
    [key: string]: any;
  }

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    type?: "submit" | "reset" | "button";
    onClick?: (e: any) => void;
    name?: string;
    value?: string | number | readonly string[];
  }

  export function forwardRef<T, P = {}>(
    render: (props: P, ref: any) => ReactElement | null
  ): (props: P & { ref?: any }) => ReactElement | null;

  export function useState<T>(initialState: T | (() => T)): [T, (action: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[] | undefined): T;
  export function useRef<T>(initialValue?: T): { current: T };
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  export const Fragment: any;
  export default React;
}

declare module "react-dom" {
  export function createRoot(container: any): any;
}

declare module "react-dom/client" {
  export function createRoot(container: any): any;
}

// --- Next.js Framework & App Router ---
declare module "next" {
  export interface Metadata {
    title?: string | { default: string; template?: string; absolute?: string };
    description?: string;
    keywords?: string[] | string;
    icons?: any;
    openGraph?: any;
    twitter?: any;
    metadataBase?: URL;
    alternates?: any;
    manifest?: string;
    viewport?: any;
    [key: string]: any;
  }
  export type NextPage<P = {}, IP = P> = (props: P) => any;
  export default Next;
}

declare module "next/link" {
  import * as React from "react";
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
  }
  const Link: React.FC<LinkProps>;
  export default Link;
}

declare module "next/navigation" {
  export function useRouter(): {
    push: (href: string) => void;
    replace: (href: string) => void;
    refresh: () => void;
    back: () => void;
    forward: () => void;
    prefetch: (href: string) => void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string | string[]>>(): T;
  export function redirect(url: string): never;
  export function notFound(): never;
}

// --- lucide-react ---
declare module "lucide-react" {
  import * as React from "react";
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type LucideIcon = React.FC<LucideProps>;

  export const Sparkles: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Code2: LucideIcon;
  export const Plus: LucideIcon;
  export const Search: LucideIcon;
  export const Folder: LucideIcon;
  export const FolderOpen: LucideIcon;
  export const FolderPlus: LucideIcon;
  export const FolderGit2: LucideIcon;
  export const File: LucideIcon;
  export const FileCode: LucideIcon;
  export const FileText: LucideIcon;
  export const FileJson: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const X: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const Play: LucideIcon;
  export const Save: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Download: LucideIcon;
  export const Trash2: LucideIcon;
  export const Edit2: LucideIcon;
  export const Moon: LucideIcon;
  export const Sun: LucideIcon;
  export const Cloud: LucideIcon;
  export const Loader2: LucideIcon;
  export const Terminal: LucideIcon;
  export const Layers: LucideIcon;
  export const Server: LucideIcon;
  export const Globe: LucideIcon;
  export const Lock: LucideIcon;
  export const GitBranch: LucideIcon;
  export const Wrench: LucideIcon;
  export const Settings: LucideIcon;

  // Wildcard fallback for any unlisted Lucide icon
  const icon: LucideIcon;
  export default icon;
}

// --- shadcn/ui & Utility Dependencies ---
declare module "@radix-ui/react-slot" {
  import * as React from "react";
  export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
  }
  export const Slot: React.ForwardRefExoticComponent<SlotProps & React.RefAttributes<HTMLElement>>;
  export const Slottable: React.FC<{ children: React.ReactNode }>;
}

declare module "class-variance-authority" {
  export type VariantProps<T extends (...args: any) => any> = T extends (props?: infer P) => any ? P : {};
  export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];
  export function cva<T = any>(base?: ClassValue, config?: any): (props?: any) => string;
}

declare module "clsx" {
  export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];
  export function clsx(...inputs: ClassValue[]): string;
  export default clsx;
}

declare module "tailwind-merge" {
  export function twMerge(...classLists: any[]): string;
}
`;

interface MonacoTypeScriptNamespace {
  typescriptDefaults: {
    setCompilerOptions: (options: Record<string, unknown>) => void;
    setDiagnosticsOptions: (options: Record<string, unknown>) => void;
    addExtraLib: (content: string, filePath?: string) => Monaco.IDisposable;
  };
  javascriptDefaults?: {
    setCompilerOptions: (options: Record<string, unknown>) => void;
    setDiagnosticsOptions: (options: Record<string, unknown>) => void;
    addExtraLib: (content: string, filePath?: string) => Monaco.IDisposable;
  };
  ScriptTarget?: { ES2022: number };
  ModuleResolutionKind?: { NodeJs: number };
  ModuleKind?: { ESNext: number };
  JsxEmit?: { ReactJSX: number };
}

/**
 * Configures Monaco's TypeScript language service to match the workspace project,
 * resolving tsconfig options, path aliases (@/*), ambient types, and all workspace files.
 */
export function configureMonacoTypeScript(monaco: typeof Monaco, project: Project) {
  const ts = (monaco.languages as unknown as { typescript: MonacoTypeScriptNamespace })?.typescript;
  if (!ts?.typescriptDefaults) return;

  const tsDefaults = ts.typescriptDefaults;
  const defaultsList = [ts.typescriptDefaults, ts.javascriptDefaults].filter(Boolean) as Array<{
    setCompilerOptions: (options: Record<string, unknown>) => void;
    setDiagnosticsOptions: (options: Record<string, unknown>) => void;
    addExtraLib: (content: string, filePath?: string) => Monaco.IDisposable;
  }>;

  // 1. Determine whether project uses a src/ directory
  const hasSrcDir = project.files.some(
    (f) => f.path.startsWith("src/") || f.path === "src"
  );

  // 2. Resolve tsconfig.json if present in the workspace
  let tsconfigPaths: Record<string, string[]> = hasSrcDir
    ? { "@/*": ["file:///src/*", "file:///*"] }
    : { "@/*": ["file:///*", "file:///src/*"] };

  const tsconfigFile = project.files.find((f) => f.path === "tsconfig.json");
  if (tsconfigFile) {
    try {
      const parsed = JSON.parse(tsconfigFile.content);
      if (parsed.compilerOptions?.paths) {
        const resolved: Record<string, string[]> = {};
        for (const [key, paths] of Object.entries(parsed.compilerOptions.paths)) {
          if (Array.isArray(paths)) {
            resolved[key] = paths.map((p: string) => {
              const cleaned = p.replace(/^\.\//, "");
              return `file:///${cleaned}`;
            });
          }
        }
        if (Object.keys(resolved).length > 0) {
          tsconfigPaths = resolved;
        }
      }
    } catch {
      // Fallback to detected src paths
    }
  }

  // 3. Configure Monaco TypeScript & JavaScript Compiler Options
  const compilerOptions = {
    target: ts.ScriptTarget?.ES2022 ?? 99,
    allowNonTextExtensions: true,
    moduleResolution: ts.ModuleResolutionKind?.NodeJs ?? 2,
    module: ts.ModuleKind?.ESNext ?? 99,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    jsx: ts.JsxEmit?.ReactJSX ?? 4,
    reactNamespace: "React",
    allowJs: true,
    resolveJsonModule: true,
    baseUrl: "file:///",
    paths: tsconfigPaths,
    strict: true,
    skipLibCheck: false,
  };

  const diagnosticsOptions = {
    noSemanticValidation: false,
    noSyntaxValidation: false,
  };

  for (const defaults of defaultsList) {
    defaults.setCompilerOptions(compilerOptions);
    defaults.setDiagnosticsOptions(diagnosticsOptions);
  }

  // 4. Configure HTML & CSS defaults in Monaco
  const htmlDefaults = (monaco.languages as unknown as { html?: { htmlDefaults?: { setOptions: (opts: unknown) => void } } })?.html?.htmlDefaults;
  if (htmlDefaults?.setOptions) {
    htmlDefaults.setOptions({
      format: { tabSize: 2, insertSpaces: true },
      suggest: { html5: true },
    });
  }

  const cssDefaults = (monaco.languages as unknown as { css?: { cssDefaults?: { setOptions: (opts: unknown) => void } } })?.css?.cssDefaults;
  if (cssDefaults?.setOptions) {
    cssDefaults.setOptions({
      validate: true,
      lint: {
        compatibleVendorPrefixes: "ignore",
        vendorPrefix: "warning",
        duplicateProperties: "warning",
        emptyRules: "warning",
      },
    });
  }

  // 5. Clean up existing extraLib disposables
  extraLibDisposables.forEach((d) => d.dispose());
  extraLibDisposables = [];

  // 6. Register ambient package definitions
  for (const defaults of defaultsList) {
    const ambientDisposable = defaults.addExtraLib(
      AMBIENT_DECLARATIONS,
      "file:///node_modules/@types/workspace-globals/index.d.ts"
    );
    extraLibDisposables.push(ambientDisposable);
  }

  // 7. Register every workspace file into Monaco's language service as an extraLib and Monaco Model
  for (const file of project.files) {
    if (file.isFolder) continue;

    const fileUri = monaco.Uri.parse(`file:///${file.path}`);

    // Register file content as extraLib so TypeScript worker can resolve exports across files
    try {
      const libDisposable = tsDefaults.addExtraLib(file.content, fileUri.toString());
      extraLibDisposables.push(libDisposable);
    } catch {
      // extraLib may already be tracked
    }

    // Ensure model exists in Monaco for language service cross-referencing
    let model = monaco.editor.getModel(fileUri);
    if (!model) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const language = ext === "tsx" || ext === "ts" ? "typescript" : ext === "jsx" || ext === "js" ? "javascript" : ext === "json" ? "json" : ext === "css" ? "css" : ext === "html" ? "html" : "plaintext";
      model = monaco.editor.createModel(file.content, language, fileUri);
    }
  }
}

/**
 * Restarts and refreshes the Monaco TypeScript language service after framework initialization,
 * package dependency updates, or workspace restructuring.
 */
export function restartMonacoLanguageService(monaco: typeof Monaco, project: Project) {
  configureMonacoTypeScript(monaco, project);
}
