import { app } from "electron";
import { execFile, spawn } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, join, relative } from "node:path";
import { promisify } from "node:util";
import type {
  ActionResult,
  InventoryItem,
  Language,
  LauncherSettings,
  LauncherSnapshot,
  ProjectInfo,
  ProjectKind,
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

const PROJECT_MARKERS: Array<{ file: string; kind: ProjectKind }> = [
  { file: "package.json", kind: "javascript" },
  { file: "pyproject.toml", kind: "python" },
  { file: "requirements.txt", kind: "python" },
  { file: "Cargo.toml", kind: "rust" },
  { file: "go.mod", kind: "go" },
  { file: "composer.json", kind: "php" },
  { file: "Gemfile", kind: "ruby" },
];
const IGNORED_PROJECT_FOLDERS = new Set(["node_modules", "dist", "build", "release", ".next", ".nuxt", ".venv", "venv", "vendor", "target", "coverage", ".git"]);
const README_NAMES = new Set(["readme.md", "readme.markdown", "readme.txt", "readme"]);
const MEANINGFUL_EXTENSIONS = new Set([
  ".ai", ".astro", ".c", ".cpp", ".cs", ".css", ".fig", ".go", ".html", ".java", ".js", ".jsx", ".json", ".md",
  ".mjs", ".php", ".plugin", ".ps1", ".psd", ".py", ".rb", ".rs", ".scss", ".sketch", ".sql", ".svelte", ".swift",
  ".toml", ".ts", ".tsx", ".vue", ".wasm", ".xd", ".yaml", ".yml", ".zip",
]);

function safeText(directory: string, relativePath: string, maxBytes = 128 * 1024): string {
  try {
    const root = realpathSync(directory);
    const filePath = realpathSync(join(directory, relativePath));
    const pathWithinRoot = relative(root, filePath);
    if (pathWithinRoot.startsWith("..") || isAbsolute(pathWithinRoot)) return "";
    const fileStat = lstatSync(filePath);
    if (!fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.size > maxBytes) return "";
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function fileExtension(name: string): string {
  const match = name.toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match?.[1] || "";
}

function directoryEntries(directory: string): string[] {
  try { return readdirSync(directory); } catch { return []; }
}

function projectMarker(directory: string, entries = directoryEntries(directory)): { marker: string; kind: ProjectKind; updatedAt: string; source: "manifest" | "git" } | null {
  const names = new Map(entries.map((entry) => [entry.toLowerCase(), entry]));
  for (const candidate of PROJECT_MARKERS) {
    const actualName = names.get(candidate.file.toLowerCase());
    if (!actualName) continue;
    const markerPath = join(directory, actualName);
    try {
      const markerStat = lstatSync(markerPath);
      if (markerStat.isSymbolicLink() || !markerStat.isFile()) continue;
      return { marker: actualName, kind: candidate.kind, updatedAt: markerStat.mtime.toISOString(), source: "manifest" };
    } catch {
      return { marker: actualName, kind: candidate.kind, updatedAt: new Date(0).toISOString(), source: "manifest" };
    }
  }
  try {
    const dotnetFile = entries.find((entry) => /\.(sln|csproj)$/i.test(entry));
    if (dotnetFile) {
      const markerPath = join(directory, dotnetFile);
      const markerStat = lstatSync(markerPath);
      if (!markerStat.isSymbolicLink() && markerStat.isFile()) return { marker: dotnetFile, kind: "dotnet", updatedAt: markerStat.mtime.toISOString(), source: "manifest" };
    }
  } catch {
    // Unreadable directories are ignored by the library scan.
  }
  const gitPath = join(directory, ".git");
  if (existsSync(gitPath)) {
    try { return { marker: ".git", kind: "git", updatedAt: statSync(gitPath).mtime.toISOString(), source: "git" }; }
    catch { return { marker: ".git", kind: "git", updatedAt: new Date(0).toISOString(), source: "git" }; }
  }
  return null;
}

function isMeaningfulFolder(directory: string, entries: string[]): boolean {
  return entries.some((entry) => {
    const lower = entry.toLowerCase();
    if (README_NAMES.has(lower)) return true;
    try { const item = lstatSync(join(directory, entry)); return !item.isSymbolicLink() && item.isFile() && MEANINGFUL_EXTENSIONS.has(fileExtension(lower)); }
    catch { return false; }
  });
}

function hasDirectProjectFile(directory: string, entries: string[]): boolean {
  return entries.some((entry) => {
    const extension = fileExtension(entry);
    if (!extension || extension === ".md" || extension === ".txt") return false;
    try { const item = lstatSync(join(directory, entry)); return !item.isSymbolicLink() && item.isFile() && MEANINGFUL_EXTENSIONS.has(extension); }
    catch { return false; }
  });
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateDescription(value: string, maxLength = 230): string {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength - 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 150 ? boundary : shortened.length).trim()}…`;
}

function readmeDescription(directory: string, entries: string[]): string | undefined {
  const readme = entries.find((entry) => README_NAMES.has(entry.toLowerCase()));
  if (!readme) return undefined;
  const raw = safeText(directory, readme);
  const blocks = raw.replace(/\r/g, "").split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed && !/^\s*(?:#|\[!|!\[|<|\||```|[-*+]\s|\d+\.\s)/.test(trimmed);
    });
    const cleaned = cleanMarkdown(lines.join(" "));
    if (cleaned.length >= 35 && !/^https?:\/\//i.test(cleaned)) return truncateDescription(cleaned);
  }
  return undefined;
}

function packageDetails(directory: string, entries: string[]): Record<string, unknown> | null {
  const packageFile = entries.find((entry) => entry.toLowerCase() === "package.json");
  if (!packageFile) return null;
  try {
    const parsed = JSON.parse(safeText(directory, packageFile, 512 * 1024)) as unknown;
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function githubUrl(value: unknown): string | undefined {
  const raw = typeof value === "string"
    ? value
    : typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).url === "string"
      ? String((value as Record<string, unknown>).url)
      : "";
  const marker = raw.toLowerCase().indexOf("github.com");
  if (marker < 0) return undefined;
  const path = raw.slice(marker + "github.com".length).replace(/^[:/]+/, "").split(/[?#]/)[0].replace(/\.git$/i, "");
  const [owner, repository] = path.split("/");
  if (!owner || !repository || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repository)) return undefined;
  return `https://github.com/${owner}/${repository}`;
}

function repositoryUrl(directory: string, packageJson: Record<string, unknown> | null): string | undefined {
  const packageRepository = githubUrl(packageJson?.repository || packageJson?.homepage);
  if (packageRepository) return packageRepository;
  const config = safeText(directory, join(".git", "config"), 64 * 1024);
  const remote = config.match(/url\s*=\s*(.+)/i)?.[1]?.trim();
  return githubUrl(remote);
}

function addDependencyTechnology(technologies: Set<string>, dependencies: Set<string>): void {
  const rules: Array<[string, string[]]> = [
    ["Next.js", ["next"]], ["React", ["react"]], ["Vue", ["vue"]], ["Nuxt", ["nuxt"]], ["SvelteKit", ["@sveltejs/kit"]],
    ["Svelte", ["svelte"]], ["Astro", ["astro"]], ["Electron", ["electron"]], ["Vite", ["vite"]], ["Tailwind CSS", ["tailwindcss"]],
    ["Express", ["express"]], ["NestJS", ["@nestjs/core"]], ["Prisma", ["prisma", "@prisma/client"]], ["Drizzle", ["drizzle-orm"]],
    ["Supabase", ["@supabase/supabase-js"]], ["Firebase", ["firebase", "firebase-admin"]], ["WordPress", ["@wordpress/scripts"]],
  ];
  for (const [label, packages] of rules) if (packages.some((name) => dependencies.has(name))) technologies.add(label);
}

function detectProjectMetadata(directory: string, entries: string[], kind: ProjectKind, packageJson: Record<string, unknown> | null): Pick<ProjectInfo, "description" | "technologies" | "services" | "repositoryUrl"> {
  const lowerNames = new Set(entries.map((entry) => entry.toLowerCase()));
  const technologies = new Set<string>();
  const services = new Set<string>();
  const dependencies = new Set<string>();
  const dependencyGroups = [packageJson?.dependencies, packageJson?.devDependencies, packageJson?.peerDependencies];
  for (const group of dependencyGroups) {
    if (typeof group === "object" && group !== null) Object.keys(group as Record<string, unknown>).forEach((name) => dependencies.add(name));
  }

  if (kind === "javascript" || lowerNames.has("package.json")) technologies.add("JavaScript");
  if (lowerNames.has("tsconfig.json") || entries.some((entry) => /\.tsx?$/i.test(entry))) technologies.add("TypeScript");
  if (kind === "python" || entries.some((entry) => /\.py$/i.test(entry))) technologies.add("Python");
  if (kind === "rust" || entries.some((entry) => /\.rs$/i.test(entry))) technologies.add("Rust");
  if (kind === "go" || entries.some((entry) => /\.go$/i.test(entry))) technologies.add("Go");
  if (kind === "dotnet" || entries.some((entry) => /\.cs$/i.test(entry))) technologies.add(".NET");
  if (kind === "php" || entries.some((entry) => /\.php$/i.test(entry))) technologies.add("PHP");
  if (kind === "ruby" || entries.some((entry) => /\.rb$/i.test(entry))) technologies.add("Ruby");
  if (entries.some((entry) => /\.html?$/i.test(entry))) technologies.add("HTML");
  if (entries.some((entry) => /\.(?:css|scss|sass)$/i.test(entry))) technologies.add("CSS");
  if (entries.some((entry) => /\.(?:fig|sketch|xd|psd|ai)$/i.test(entry))) technologies.add("Design assets");
  addDependencyTechnology(technologies, dependencies);

  const phpEntry = entries.find((entry) => /\.php$/i.test(entry));
  const phpHeader = phpEntry ? safeText(directory, phpEntry, 64 * 1024).slice(0, 12_000) : "";
  if (/Plugin Name\s*:/i.test(phpHeader)) technologies.add("WordPress Plugin");
  else if (lowerNames.has("style.css") && /Theme Name\s*:/i.test(safeText(directory, entries.find((entry) => entry.toLowerCase() === "style.css") || "", 64 * 1024))) technologies.add("WordPress Theme");

  const repo = repositoryUrl(directory, packageJson);
  if (repo) services.add("GitHub");
  if (lowerNames.has("vercel.json") || lowerNames.has(".vercel") || [...dependencies].some((name) => name.startsWith("@vercel/"))) services.add("Vercel");
  if (lowerNames.has("netlify.toml") || lowerNames.has(".netlify")) services.add("Netlify");
  if (lowerNames.has("render.yaml") || lowerNames.has("render.yml")) services.add("Render");
  if (lowerNames.has("railway.json") || lowerNames.has("railway.toml")) services.add("Railway");
  if (lowerNames.has("wrangler.toml") || lowerNames.has("wrangler.jsonc")) services.add("Cloudflare");
  if (lowerNames.has("dockerfile") || [...lowerNames].some((name) => /^docker-compose.*\.ya?ml$/.test(name))) services.add("Docker");
  if (lowerNames.has("supabase") || dependencies.has("@supabase/supabase-js")) services.add("Supabase");

  const packageDescription = typeof packageJson?.description === "string" ? cleanMarkdown(packageJson.description) : "";
  const pluginDescription = phpHeader.match(/Description\s*:\s*([^\r\n]+)/i)?.[1]?.trim();
  const description = readmeDescription(directory, entries) || (packageDescription ? truncateDescription(packageDescription) : undefined) || (pluginDescription ? truncateDescription(pluginDescription) : undefined);
  return { description, technologies: [...technologies].slice(0, 12), services: [...services], repositoryUrl: repo };
}

function genericKind(entries: string[]): ProjectKind {
  if (entries.some((entry) => /\.php$/i.test(entry))) return "php";
  if (entries.some((entry) => /\.(?:tsx?|jsx?|mjs)$/i.test(entry))) return "javascript";
  if (entries.some((entry) => /\.py$/i.test(entry))) return "python";
  if (entries.some((entry) => /\.rs$/i.test(entry))) return "rust";
  if (entries.some((entry) => /\.go$/i.test(entry))) return "go";
  if (entries.some((entry) => /\.(?:cs|sln|csproj)$/i.test(entry))) return "dotnet";
  if (entries.some((entry) => /\.rb$/i.test(entry))) return "ruby";
  return "folder";
}

function folderUpdatedAt(directory: string, entries: string[]): string {
  let timestamp = 0;
  for (const entry of entries.slice(0, 200)) {
    try { timestamp = Math.max(timestamp, lstatSync(join(directory, entry)).mtimeMs); } catch { /* Ignore changing files. */ }
  }
  try { timestamp = Math.max(timestamp, statSync(directory).mtimeMs); } catch { /* Ignore unreadable folders. */ }
  return new Date(timestamp || 0).toISOString();
}

export function discoverProjects(roots: string[], maxDepth = 2, includeRootFolders = false): ProjectInfo[] {
  const projects = new Map<string, ProjectInfo>();
  const uniqueRoots = [...new Map(roots.filter(Boolean).map((root) => [root.toLowerCase(), root])).values()];
  for (const root of uniqueRoots) {
    if (!existsSync(root)) continue;
    const queue: Array<{ directory: string; depth: number; insideProject: boolean }> = [{ directory: root, depth: 0, insideProject: false }];
    while (queue.length && projects.size < 250) {
      const current = queue.shift()!;
      let directoryStat;
      try {
        directoryStat = statSync(current.directory);
      } catch {
        continue;
      }
      if (!directoryStat.isDirectory()) continue;
      const entries = directoryEntries(current.directory);
      const marker = current.depth > 0 || includeRootFolders ? projectMarker(current.directory, entries) : null;
      const generic = !marker && !current.insideProject && (current.depth > 0 || includeRootFolders) && isMeaningfulFolder(current.directory, entries);
      if (marker || generic) {
        const key = current.directory.toLowerCase();
        const kind = marker?.kind || genericKind(entries);
        const packageJson = packageDetails(current.directory, entries);
        projects.set(key, {
          name: basename(current.directory) || current.directory,
          path: current.directory,
          root,
          kind,
          marker: marker?.marker || "local folder",
          updatedAt: marker?.updatedAt || folderUpdatedAt(current.directory, entries),
          source: marker?.source || "folder",
          ...detectProjectMetadata(current.directory, entries, kind, packageJson),
        });
      }
      if (current.depth >= maxDepth) continue;
      for (const entry of entries) {
        if (entry.startsWith(".") || IGNORED_PROJECT_FOLDERS.has(entry.toLowerCase())) continue;
        const child = join(current.directory, entry);
        try {
          const childStat = lstatSync(child);
          if (!childStat.isSymbolicLink() && childStat.isDirectory()) queue.push({
            directory: child,
            depth: current.depth + 1,
            insideProject: current.insideProject || Boolean(marker) || (generic && current.depth > 0 && hasDirectProjectFile(current.directory, entries)),
          });
        } catch {
          // A directory can disappear during a scan.
        }
      }
    }
  }
  return [...projects.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));
}

export function automaticProjectRoots(): string[] {
  const home = homedir();
  const candidates = [
    join(app.getPath("desktop"), "Desarrollo J"), join(app.getPath("desktop"), "Development"), join(app.getPath("desktop"), "Projects"),
    join(app.getPath("documents"), "GitHub"), join(app.getPath("documents"), "Projects"),
    join(home, "Developer"), join(home, "Projects"), join(home, "dev"), join(home, "source", "repos"),
  ];
  return [...new Map(candidates.filter((root) => existsSync(root)).map((root) => [root.toLowerCase(), root])).values()];
}

export function scanProjectLibrary(customRoots: string[]): { projects: ProjectInfo[]; automaticRoots: string[] } {
  const automaticRoots = automaticProjectRoots();
  const combined = new Map<string, ProjectInfo>();
  for (const project of [...discoverProjects(automaticRoots, 3), ...discoverProjects(customRoots, 3, true)]) combined.set(project.path.toLowerCase(), project);
  const projects = [...combined.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));
  return { projects, automaticRoots };
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

function defaultSettings(): LauncherSettings {
  return {
    projectPath: app.getPath("documents"),
    autoCheckTools: true,
    autoCheckLauncher: true,
    startWithWindows: false,
    language: normalizeLanguage(app.getLocale()),
    projectRoots: [],
  };
}

function isDirectory(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 32_767) return false;
  try { return existsSync(value) && statSync(value).isDirectory(); } catch { return false; }
}

export function normalizeSettings(value: unknown, defaults = defaultSettings()): LauncherSettings {
  const settings = typeof value === "object" && value !== null ? value as Partial<LauncherSettings> : {};
  const roots = Array.isArray(settings.projectRoots) ? settings.projectRoots : [];
  return {
    projectPath: isDirectory(settings.projectPath) ? settings.projectPath : defaults.projectPath,
    autoCheckTools: typeof settings.autoCheckTools === "boolean" ? settings.autoCheckTools : defaults.autoCheckTools,
    autoCheckLauncher: typeof settings.autoCheckLauncher === "boolean" ? settings.autoCheckLauncher : defaults.autoCheckLauncher,
    startWithWindows: typeof settings.startWithWindows === "boolean" ? settings.startWithWindows : defaults.startWithWindows,
    language: normalizeLanguage(settings.language || defaults.language),
    projectRoots: [...new Map(roots.filter(isDirectory).slice(0, 25).map((root) => [root.toLowerCase(), root])).values()],
  };
}

export function readSettings(): LauncherSettings {
  const defaults = defaultSettings();
  try {
    return normalizeSettings(JSON.parse(readFileSync(settingsFile(), "utf8")), defaults);
  } catch {
    return defaults;
  }
}

export function writeSettings(settings: unknown): LauncherSettings {
  const normalized = normalizeSettings(settings);
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
