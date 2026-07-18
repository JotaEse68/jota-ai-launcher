export type ToolId = "codex" | "claude" | "opencode";
export type ToolAction = "launch" | "resume" | "login" | "logout" | "install" | "update" | "updatePlugins";
export type Language = "es" | "en" | "fr" | "pt" | "it" | "de";

export interface InventoryItem {
  name: string;
  version?: string;
  status?: string;
  source?: string;
}

export type ProjectKind = "javascript" | "python" | "rust" | "go" | "dotnet" | "php" | "ruby" | "git";

export interface ProjectInfo {
  name: string;
  path: string;
  root: string;
  kind: ProjectKind;
  marker: string;
  updatedAt: string;
}

export interface ToolStatus {
  id: ToolId;
  name: string;
  subtitle: string;
  installed: boolean;
  version?: string;
  latestVersion?: string;
  authenticated: boolean;
  authLabel: string;
  plugins: InventoryItem[];
  skills: InventoryItem[];
  mcpSummary: string;
  docsUrl: string;
  downloadUrl: string;
  accountUrl: string;
  accent: string;
}

export interface LauncherSnapshot {
  scannedAt: string;
  tools: ToolStatus[];
  nodeInstalled: boolean;
  shell: "Windows Terminal" | "PowerShell" | "Terminal";
  platform: "windows" | "macos" | "other";
}

export interface LauncherSettings {
  projectPath: string;
  autoCheckTools: boolean;
  autoCheckLauncher: boolean;
  startWithWindows: boolean;
  language: Language;
  projectRoots: string[];
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface LauncherBridge {
  scan: (includeLatest?: boolean) => Promise<LauncherSnapshot>;
  getSettings: () => Promise<LauncherSettings>;
  saveSettings: (settings: LauncherSettings) => Promise<LauncherSettings>;
  selectProject: (language: Language) => Promise<string | null>;
  selectProjectRoot: (language: Language) => Promise<string | null>;
  scanProjects: (roots: string[]) => Promise<{ projects: ProjectInfo[]; automaticRoots: string[] }>;
  openFolder: (path: string) => Promise<ActionResult>;
  runAction: (tool: ToolId, action: ToolAction, projectPath: string, language: Language) => Promise<ActionResult>;
  openLink: (url: string) => Promise<void>;
  checkLauncherUpdate: (language: Language) => Promise<ActionResult>;
}
