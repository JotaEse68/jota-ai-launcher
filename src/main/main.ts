import { app, BrowserWindow, dialog, ipcMain, session, shell, type IpcMainInvokeEvent } from "electron";
import { autoUpdater } from "electron-updater";
import { realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Language, LauncherSettings, ToolAction, ToolId } from "../shared/types";
import { buildSnapshot, openToolTerminal, readSettings, scanCleanupDirectory, scanProjectLibrary, writeSettings } from "./services";
import { mainText, normalizeLanguage } from "./localization";

let mainWindow: BrowserWindow | null = null;
const VALID_TOOLS = new Set<ToolId>(["codex", "claude", "opencode"]);
const VALID_ACTIONS = new Set<ToolAction>(["launch", "resume", "login", "logout", "install", "update", "updatePlugins"]);
const ALLOWED_LINK_HOSTS = new Set([
  "developers.openai.com",
  "learn.chatgpt.com",
  "chatgpt.com",
  "code.claude.com",
  "claude.ai",
  "opencode.ai",
  "jsantos.pro",
  "iapacks.com",
  "github.com",
]);
const approvedDirectories = new Set<string>();

function normalizedPath(value: string): string {
  const normalized = resolve(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function isSafeHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4_096) return false;
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && hostname !== "localhost" && hostname !== "0.0.0.0" && hostname !== "127.0.0.1" && hostname !== "::1";
  } catch {
    return false;
  }
}

function directoryKey(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.length > 32_767) return null;
  try {
    const normalized = realpathSync.native(resolve(value));
    return statSync(normalized).isDirectory() ? (process.platform === "win32" ? normalized.toLowerCase() : normalized) : null;
  } catch {
    return null;
  }
}

function approveDirectory(value: string): void {
  const key = directoryKey(value);
  if (key) approvedDirectories.add(key);
}

function isApprovedDirectory(value: unknown): value is string {
  const key = directoryKey(value);
  return typeof value === "string" && key !== null && approvedDirectories.has(key);
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error("IPC sender not allowed");
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 650,
    backgroundColor: "#e9eef3",
    title: "Jota AI Launcher",
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: !app.isPackaged,
    },
  });

  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  mainWindow.webContents.on("will-attach-webview", (event) => event.preventDefault());
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  const screenshotPath = process.env.LAUNCHER_SCREENSHOT_PATH;
  if (screenshotPath) {
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
        const requestedView = process.env.LAUNCHER_SCREENSHOT_VIEW;
        if (requestedView && /^[a-z]+$/.test(requestedView)) {
          await mainWindow?.webContents.executeJavaScript(`document.querySelector('[data-view="${requestedView}"]')?.click()`);
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
        const image = await mainWindow?.webContents.capturePage();
        if (image) require("node:fs").writeFileSync(screenshotPath, image.toPNG());
        app.quit();
      }, 12_000);
    });
  }
  const developmentUrl = process.env.VITE_DEV_SERVER_URL;
  if (developmentUrl) {
    void mainWindow.loadURL(developmentUrl);
  } else {
    void mainWindow.loadURL(pathToFileURL(join(__dirname, "../renderer/index.html")).toString());
  }
}

function registerIpc(): void {
  const initialSettings = readSettings();
  approveDirectory(initialSettings.projectPath);
  initialSettings.projectRoots.forEach(approveDirectory);
  initialSettings.hiddenProjects.forEach(approveDirectory);

  ipcMain.handle("launcher:scan", async (event, includeLatest: boolean) => {
    assertTrustedSender(event);
    const startedAt = Date.now();
    const snapshot = await buildSnapshot(Boolean(includeLatest));
    console.log(`[launcher] scan ${includeLatest ? "complete" : "rápido"}: ${Date.now() - startedAt} ms`);
    return snapshot;
  });
  ipcMain.handle("launcher:settings:get", (event) => {
    assertTrustedSender(event);
    return readSettings();
  });
  ipcMain.handle("launcher:settings:save", (event, requestedSettings: unknown) => {
    assertTrustedSender(event);
    const current = readSettings();
    const candidate = typeof requestedSettings === "object" && requestedSettings !== null ? requestedSettings as Partial<LauncherSettings> : {};
    const requestedRoots = Array.isArray(candidate.projectRoots) ? candidate.projectRoots.filter(isApprovedDirectory) : current.projectRoots;
    return writeSettings({
      ...current,
      ...candidate,
      projectPath: isApprovedDirectory(candidate.projectPath) ? candidate.projectPath : current.projectPath,
      projectRoots: requestedRoots,
    });
  });
  ipcMain.handle("launcher:project:select", async (event, requestedLanguage: Language) => {
    assertTrustedSender(event);
    const language = normalizeLanguage(requestedLanguage);
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: mainText(language, "chooseProject"),
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled) return null;
    approveDirectory(result.filePaths[0]);
    return result.filePaths[0];
  });
  ipcMain.handle("launcher:project-root:select", async (event, requestedLanguage: Language) => {
    assertTrustedSender(event);
    const language = normalizeLanguage(requestedLanguage);
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: mainText(language, "chooseProjectRoot"),
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled) return null;
    approveDirectory(result.filePaths[0]);
    return result.filePaths[0];
  });
  ipcMain.handle("launcher:directory:authorize", (event, requestedPath: unknown) => {
    assertTrustedSender(event);
    const value = typeof requestedPath === "string" ? requestedPath.trim().replace(/^['"]|['"]$/g, "") : "";
    const key = directoryKey(value);
    if (!key) return { ok: false, message: "La carpeta no existe o no se puede leer." };
    approveDirectory(value);
    return { ok: true, message: "Carpeta añadida.", path: realpathSync.native(resolve(value)) };
  });
  ipcMain.handle("launcher:projects:scan", (event) => {
    assertTrustedSender(event);
    const result = scanProjectLibrary(readSettings().projectRoots);
    result.projects.forEach((project) => approveDirectory(project.path));
    return result;
  });
  ipcMain.handle("launcher:folder:open", async (event, requestedPath: string) => {
    assertTrustedSender(event);
    try {
      if (!isApprovedDirectory(requestedPath)) return { ok: false, message: "Folder not allowed" };
      const error = await shell.openPath(requestedPath);
      return { ok: !error, message: error };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Folder not found" };
    }
  });
  ipcMain.handle("launcher:cleanup:scan", (event, requestedPath: string) => {
    assertTrustedSender(event);
    if (!isApprovedDirectory(requestedPath)) throw new Error("Selecciona o autoriza primero la carpeta que quieres analizar.");
    return scanCleanupDirectory(requestedPath);
  });
  ipcMain.handle("launcher:cleanup:trash", async (event, requestedRoot: string, requestedPaths: unknown, requestedLanguage: Language) => {
    assertTrustedSender(event);
    if (!isApprovedDirectory(requestedRoot) || !Array.isArray(requestedPaths) || requestedPaths.length > 100) return { ok: false, message: "Selección no permitida." };
    const report = scanCleanupDirectory(requestedRoot);
    const allowed = new Map(report.items.filter((item) => item.recommendation !== "keep").map((item) => [normalizedPath(item.path), item.path]));
    const targets = [...new Set(requestedPaths.filter((item): item is string => typeof item === "string").map(normalizedPath))]
      .map((path) => allowed.get(path)).filter((path): path is string => Boolean(path));
    if (!targets.length) return { ok: false, message: "No hay elementos eliminables seleccionados." };
    const language = normalizeLanguage(requestedLanguage);
    const copy = language === "es"
      ? { title: "Confirmar limpieza", detail: `${targets.length} elemento(s) se enviarán a la papelera. Podrás recuperarlos desde el sistema.`, cancel: "Cancelar", confirm: "Enviar a la papelera", done: "Limpieza completada: {count} elemento(s) enviados a la papelera." }
      : { title: "Confirm cleanup", detail: `${targets.length} item(s) will be moved to the recycle bin. You can restore them from the system.`, cancel: "Cancel", confirm: "Move to recycle bin", done: "Cleanup complete: {count} item(s) moved to the recycle bin." };
    const confirmation = await dialog.showMessageBox(mainWindow!, { type: "warning", title: copy.title, message: copy.title, detail: copy.detail, buttons: [copy.cancel, copy.confirm], defaultId: 0, cancelId: 0, noLink: true });
    if (confirmation.response !== 1) return { ok: false, message: copy.cancel };
    let removed = 0;
    for (const target of targets) {
      try { await shell.trashItem(target); removed += 1; } catch { /* Continue so one locked cache does not stop the rest. */ }
    }
    return { ok: removed > 0, message: copy.done.replace("{count}", String(removed)) };
  });
  ipcMain.handle("launcher:action", (event, tool: ToolId, action: ToolAction, requestedLanguage: Language) => {
    assertTrustedSender(event);
    const language = normalizeLanguage(requestedLanguage);
    if (!VALID_TOOLS.has(tool) || !VALID_ACTIONS.has(action)) throw new Error(mainText(language, "actionDenied"));
    return openToolTerminal(tool, action, readSettings().projectPath, language);
  });
  ipcMain.handle("launcher:link", async (event, url: string) => {
    assertTrustedSender(event);
    if (!isSafeHttpsUrl(url)) throw new Error("Enlace no permitido");
    const parsed = new URL(url);
    if (!ALLOWED_LINK_HOSTS.has(parsed.hostname)) console.log(`[launcher] opening project link: ${parsed.hostname}`);
    await shell.openExternal(parsed.toString());
  });
  ipcMain.handle("launcher:update:self", async (event, requestedLanguage: Language) => {
    assertTrustedSender(event);
    const language = normalizeLanguage(requestedLanguage);
    if (!app.isPackaged) return { ok: true, message: mainText(language, "updaterInstalledOnly") };
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      return { ok: true, message: result?.updateInfo.version === app.getVersion() ? mainText(language, "launcherCurrent") : mainText(language, "updateChecked") };
    } catch {
      return { ok: false, message: mainText(language, "updateChannelUnavailable") };
    }
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionCheckHandler((webContents, permission, _origin, details) =>
    Boolean(mainWindow && webContents === mainWindow.webContents && permission === "media" && details.mediaType === "audio"),
  );
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const mediaTypes = "mediaTypes" in details ? details.mediaTypes || [] : [];
    const audioOnly = mediaTypes.length > 0 && mediaTypes.every((type) => type === "audio");
    callback(Boolean(mainWindow && webContents === mainWindow.webContents && permission === "media" && audioOnly));
  });
  registerIpc();
  createWindow();
  const settings = readSettings();
  if (app.isPackaged && settings.autoCheckLauncher) {
    setTimeout(() => void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined), 8_000);
  }
});

app.on("window-all-closed", () => app.quit());
