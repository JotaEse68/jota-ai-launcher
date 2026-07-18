export type ToolId = "codex" | "claude" | "opencode";
export type ToolAction = "launch" | "resume" | "login" | "logout" | "install" | "update" | "updatePlugins";

export interface InventoryItem {
  name: string;
  version?: string;
  status?: string;
  source?: string;
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
  shell: "Windows Terminal" | "PowerShell";
}

export interface LauncherSettings {
  projectPath: string;
  autoCheckTools: boolean;
  autoCheckLauncher: boolean;
  startWithWindows: boolean;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface LauncherBridge {
  scan: (includeLatest?: boolean) => Promise<LauncherSnapshot>;
  getSettings: () => Promise<LauncherSettings>;
  saveSettings: (settings: LauncherSettings) => Promise<LauncherSettings>;
  selectProject: () => Promise<string | null>;
  runAction: (tool: ToolId, action: ToolAction, projectPath: string) => Promise<ActionResult>;
  openLink: (url: string) => Promise<void>;
  checkLauncherUpdate: () => Promise<ActionResult>;
}
