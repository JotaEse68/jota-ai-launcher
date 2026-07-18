import { app } from "electron";
import { execFile, spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type {
  ActionResult,
  InventoryItem,
  Language,
  LauncherSettings,
  LauncherSnapshot,
  ToolAction,
  ToolId,
  ToolStatus,
} from "../shared/types";
import { TOOL_DEFINITIONS, TOOL_IDS } from "./definitions";
import { mainText, normalizeLanguage } from "./localization";

const execFileAsync = promisify(execFile);
const IS_WINDOWS = process.platform === "win32";

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

async function captureCommand(commandLine: string, timeout = 20_000): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    IS_WINDOWS ? "cmd.exe" : "/bin/zsh",
    IS_WINDOWS ? ["/d", "/s", "/c", commandLine] : ["-lc", commandLine],
    { windowsHide: true, timeout, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  return `${stdout || ""}${stderr || ""}`.trim();
}

async function commandExists(command: string): Promise<boolean> {
  try {
    if (!/^[a-z0-9@._-]+$/i.test(command)) return false;
    if (IS_WINDOWS) await execFileAsync("where.exe", [command], { windowsHide: true, timeout: 5_000 });
    else await execFileAsync("/bin/zsh", ["-lc", `command -v ${shellQuote(command)}`], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

function firstVersion(output: string): string | undefined {
  return output.match(/\b\d+\.\d+\.\d+(?:[-+][\w.-]+)?\b/)?.[0];
}

function parseInventoryJson(raw: string): InventoryItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const array = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" && parsed !== null
        ? (((parsed as Record<string, unknown>).plugins as unknown[]) ||
          ((parsed as Record<string, unknown>).installed as unknown[]) || [])
        : [];
    return array
      .map((entry): InventoryItem | null => {
        if (typeof entry !== "object" || entry === null) return null;
        const item = entry as Record<string, unknown>;
        const name = String(item.name || item.id || item.pluginId || item.plugin || "").trim();
        const status = String(item.status || (item.enabled === false ? "desactivado" : "activo"));
        if (!name || /not installed/i.test(status)) return null;
        return {
          name,
          version: item.version ? String(item.version) : undefined,
          status,
          source: item.marketplace ? String(item.marketplace) : item.scope ? String(item.scope) : undefined,
        };
      })
      .filter((item): item is InventoryItem => Boolean(item));
  } catch {
    return [];
  }
}

const skillRootCache = new Map<string, InventoryItem[]>();

function collectSkillRoot(root: string): InventoryItem[] {
  const cached = skillRootCache.get(root.toLowerCase());
  if (cached) return cached;
  const found: InventoryItem[] = [];
  const visit = (directory: string, depth: number) => {
    if (depth > 6 || !existsSync(directory)) return;
    let entries: string[] = [];
    try {
      entries = readdirSync(directory);
    } catch {
      return;
    }
    if (entries.some((entry) => entry.toLowerCase() === "skill.md")) {
      const name = directory.split(/[\\/]/).filter(Boolean).at(-1) || directory;
      found.push({ name, source: directory });
      return;
    }
    for (const entry of entries) {
      const fullPath = join(directory, entry);
      try {
        if (statSync(fullPath).isDirectory() && !["node_modules", ".git", "cache"].includes(entry)) {
          visit(fullPath, depth + 1);
        }
      } catch {
        // A folder can disappear during a plugin update; the next scan will include it.
      }
    }
  };
  visit(root, 0);
  skillRootCache.set(root.toLowerCase(), found);
  return found;
}

function collectSkills(roots: string[]): InventoryItem[] {
  const unique = new Map<string, InventoryItem>();
  roots.flatMap(collectSkillRoot).forEach((skill) => {
    if (!unique.has(skill.name.toLowerCase())) unique.set(skill.name.toLowerCase(), skill);
  });
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function safeCapture(script: string, timeout = 20_000): Promise<string> {
  try {
    return await captureCommand(script, timeout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.slice(0, 500);
  }
}

async function latestNpmVersion(packageName: string): Promise<string | undefined> {
  try {
    const raw = await captureCommand(`npm view ${packageName} version --json`, 30_000);
    return firstVersion(raw);
  } catch {
    return undefined;
  }
}

function authResult(tool: ToolId, output: string): { authenticated: boolean; label: string } {
  if (tool === "claude") {
    try {
      const data = JSON.parse(output) as { loggedIn?: boolean; authMethod?: string };
      return data.loggedIn
        ? { authenticated: true, label: `Cuenta de Claude conectada${data.authMethod ? ` · ${data.authMethod}` : ""}` }
        : { authenticated: false, label: "Sin cuenta conectada" };
    } catch {
      // Older Claude Code versions return plain text; use the generic parser below.
    }
  }
  const normalized = output.toLowerCase();
  if (!output || /not logged|no credential|no provider|not authenticated|unauthenticated/.test(normalized)) {
    return { authenticated: false, label: "Sin cuenta conectada" };
  }
  if (tool === "opencode" && /0\s+(providers?|credentials?)/.test(normalized)) {
    return { authenticated: false, label: "Sin proveedor conectado" };
  }
  const line = output.split(/\r?\n/).find((value) => value.trim())?.trim() || "Cuenta conectada";
  return { authenticated: true, label: line.slice(0, 90) };
}

async function scanTool(id: ToolId, includeLatest: boolean): Promise<ToolStatus> {
  const definition = TOOL_DEFINITIONS[id];
  const installed = await commandExists(definition.command);
  const base: ToolStatus = {
    id,
    name: definition.name,
    subtitle: definition.subtitle,
    installed,
    authenticated: false,
    authLabel: installed ? "Comprobando cuenta" : "Instalación necesaria",
    plugins: [],
    skills: [],
    mcpSummary: "",
    docsUrl: definition.docsUrl,
    downloadUrl: definition.downloadUrl,
    accountUrl: definition.accountUrl,
    accent: definition.accent,
  };

  const commonSkills = [join(homedir(), ".agents", "skills")];
  const skillRoots = id === "codex"
    ? [...commonSkills, join(homedir(), ".codex", "skills")]
    : id === "claude"
      ? [...commonSkills, join(homedir(), ".claude", "skills")]
      : [...commonSkills, join(homedir(), ".config", "opencode", "skills"), join(homedir(), ".config", "opencode", "plugins")];
  base.skills = collectSkills(skillRoots);

  if (!installed) {
    if (includeLatest) base.latestVersion = await latestNpmVersion(definition.packageName);
    return base;
  }

  const commands = id === "codex"
      ? {
        version: "codex --version",
        auth: "codex login status",
        plugins: "codex plugin list --json",
        mcp: "codex mcp list",
      }
      : id === "claude"
      ? {
          version: "claude --version",
          auth: "claude auth status",
          plugins: "claude plugin list --json",
          mcp: "claude mcp list",
        }
      : {
          version: "opencode --version",
          auth: "opencode auth list",
          plugins: "''",
          mcp: "opencode mcp list",
        };

  const [versionOutput, authOutput, pluginOutput, mcpOutput, latestVersion] = await Promise.all([
    safeCapture(commands.version),
    safeCapture(commands.auth),
    includeLatest ? safeCapture(commands.plugins, 60_000) : Promise.resolve(""),
    includeLatest ? safeCapture(commands.mcp, 45_000) : Promise.resolve(""),
    includeLatest ? latestNpmVersion(definition.packageName) : Promise.resolve(undefined),
  ]);

  const auth = authResult(id, authOutput);
  base.version = firstVersion(versionOutput);
  base.latestVersion = latestVersion;
  base.authenticated = auth.authenticated;
  base.authLabel = auth.label;
  base.plugins = parseInventoryJson(pluginOutput);
  base.mcpSummary = mcpOutput.slice(0, 4_000);
  return base;
}

export async function buildSnapshot(includeLatest = false): Promise<LauncherSnapshot> {
  skillRootCache.clear();
  const [tools, nodeInstalled, terminalInstalled] = await Promise.all([
    Promise.all(TOOL_IDS.map((id) => scanTool(id, includeLatest))),
    commandExists("node"),
    IS_WINDOWS ? commandExists("wt") : Promise.resolve(true),
  ]);
  return {
    scannedAt: new Date().toISOString(),
    tools,
    nodeInstalled,
    shell: IS_WINDOWS ? (terminalInstalled ? "Windows Terminal" : "PowerShell") : "Terminal",
    platform: process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "other",
  };
}

function settingsFile(): string {
  return join(app.getPath("userData"), "settings.json");
}

export function readSettings(): LauncherSettings {
  const defaults: LauncherSettings = {
    projectPath: app.getPath("documents"),
    autoCheckTools: true,
    autoCheckLauncher: true,
    startWithWindows: false,
    language: normalizeLanguage(app.getLocale()),
  };
  try {
    const stored = JSON.parse(readFileSync(settingsFile(), "utf8")) as Partial<LauncherSettings>;
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}

export function writeSettings(settings: LauncherSettings): LauncherSettings {
  const normalized: LauncherSettings = {
    projectPath: existsSync(settings.projectPath) ? settings.projectPath : app.getPath("documents"),
    autoCheckTools: Boolean(settings.autoCheckTools),
    autoCheckLauncher: Boolean(settings.autoCheckLauncher),
    startWithWindows: Boolean(settings.startWithWindows),
    language: normalizeLanguage(settings.language),
  };
  writeFileSync(settingsFile(), JSON.stringify(normalized, null, 2), "utf8");
  app.setLoginItemSettings({ openAtLogin: normalized.startWithWindows });
  return normalized;
}

function actionCommand(tool: ToolId, action: ToolAction): string {
  const commands: Record<ToolId, Record<ToolAction, string>> = {
    codex: {
      launch: "codex",
      resume: "codex resume",
      login: "codex login",
      logout: "codex logout",
      install: "npm install --global @openai/codex@latest",
      update: "codex update",
      updatePlugins: "codex plugin marketplace upgrade",
    },
    claude: {
      launch: "claude",
      resume: "claude --resume",
      login: "claude auth login",
      logout: "claude auth logout",
      install: "npm install --global @anthropic-ai/claude-code@latest",
      update: "claude update",
      updatePlugins: "claude plugin marketplace update claude-plugins-official",
    },
    opencode: {
      launch: "opencode",
      resume: "opencode --continue",
      login: "opencode auth login",
      logout: "opencode auth logout",
      install: "npm install --global opencode-ai@latest",
      update: "opencode upgrade --method npm",
      updatePlugins: "opencode",
    },
  };
  return commands[tool][action];
}

export async function openToolTerminal(tool: ToolId, action: ToolAction, requestedPath: string, language: Language): Promise<ActionResult> {
  const projectPath = existsSync(requestedPath) && statSync(requestedPath).isDirectory()
    ? requestedPath
    : app.getPath("documents");
  const command = actionCommand(tool, action);
  const title = `${TOOL_DEFINITIONS[tool].name} · Jota AI Launcher`;
  const terminalInstalled = IS_WINDOWS && await commandExists("wt");

  try {
    const child = process.platform === "darwin"
      ? spawn("/usr/bin/osascript", [
          "-e", "tell application \"Terminal\"",
          "-e", "activate",
          "-e", `do script "${(`cd ${shellQuote(projectPath)} && clear && ${command}`).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`,
          "-e", "end tell",
        ], { detached: true, stdio: "ignore" })
      : terminalInstalled
      ? spawn("wt.exe", ["-w", "new", "nt", "--title", title, "-d", projectPath, "powershell.exe", "-NoLogo", "-NoExit", "-Command", command], {
          detached: true,
          stdio: "ignore",
          windowsHide: false,
        })
      : spawn("powershell.exe", ["-NoLogo", "-NoExit", "-Command", command], {
          cwd: projectPath,
          detached: true,
          stdio: "ignore",
          windowsHide: false,
        });
    child.unref();
    return { ok: true, message: mainText(language, "terminalOpened", { tool: TOOL_DEFINITIONS[tool].name }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : mainText(language, "terminalFailed") };
  }
}
