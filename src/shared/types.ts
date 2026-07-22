export type ToolId = "codex" | "claude" | "opencode";
export type ToolAction = "launch" | "resume" | "login" | "logout" | "install" | "update" | "updatePlugins";
export type Language = "es" | "en" | "fr" | "pt" | "it" | "de";

export interface InventoryItem {
  name: string;
  version?: string;
  status?: string;
  source?: string;
}

export type ProjectKind = "javascript" | "python" | "rust" | "go" | "dotnet" | "php" | "ruby" | "git" | "folder";
export type ProjectType = "web-app" | "desktop-app" | "plugin" | "theme" | "library" | "service" | "website" | "folder";
export type ProjectPhase = "backlog" | "building" | "testing" | "shipping" | "done" | "paused" | "abandoned";
export type CleanupRecommendation = "safe" | "review" | "keep";
export type CleanupKind = "dependencies" | "build" | "cache" | "logs" | "empty" | "protected";

export interface ProjectPlan {
  phase: ProjectPhase;
  deadline: string;
  nextAction: string;
  definitionOfDone: string;
  focus: boolean;
  updatedAt: string;
  lastSessionSummary: string;
  blocker: string;
  lastSessionAt: string;
  abandonedReason: string;
  lessonLearned: string;
}

export interface ProjectInfo {
  name: string;
  path: string;
  root: string;
  kind: ProjectKind;
  marker: string;
  updatedAt: string;
  description?: string;
  technologies: string[];
  services: string[];
  repositoryUrl?: string;
  publicUrl?: string;
  deploymentService?: string;
  projectType: ProjectType;
  source: "manifest" | "git" | "folder";
}

export interface CleanupItem {
  path: string;
  relativePath: string;
  name: string;
  kind: CleanupKind;
  recommendation: CleanupRecommendation;
  reason: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface CleanupReport {
  root: string;
  scannedAt: string;
  items: CleanupItem[];
  recoverableBytes: number;
  truncated: boolean;
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
  projectPlans: Record<string, ProjectPlan>;
  projectLinks: Record<string, string>;
  hiddenProjects: string[];
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
  authorizeDirectory: (path: string) => Promise<ActionResult & { path?: string }>;
  scanProjects: () => Promise<{ projects: ProjectInfo[]; automaticRoots: string[] }>;
  openFolder: (path: string) => Promise<ActionResult>;
  scanCleanup: (path: string) => Promise<CleanupReport>;
  trashCleanupItems: (root: string, paths: string[], language: Language) => Promise<ActionResult>;
  runAction: (tool: ToolId, action: ToolAction, language: Language) => Promise<ActionResult>;
  openLink: (url: string) => Promise<void>;
  checkLauncherUpdate: (language: Language) => Promise<ActionResult>;
}
