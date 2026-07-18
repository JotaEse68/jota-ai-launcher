import { app, BrowserWindow, dialog, ipcMain, session, shell, type IpcMainInvokeEvent } from "electron";
import { autoUpdater } from "electron-updater";
import { realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Language, LauncherSettings, ToolAction, ToolId } from "../shared/types";
import { buildSnapshot, openToolTerminal, readSettings, scanProjectLibrary, writeSettings } from "./services";
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
  ipcMain.handle("launcher:action", (event, tool: ToolId, action: ToolAction, requestedLanguage: Language) => {
    assertTrustedSender(event);
    const language = normalizeLanguage(requestedLanguage);
    if (!VALID_TOOLS.has(tool) || !VALID_ACTIONS.has(action)) throw new Error(mainText(language, "actionDenied"));
    return openToolTerminal(tool, action, readSettings().projectPath, language);
  });
  ipcMain.handle("launcher:link", async (event, url: string) => {
    assertTrustedSender(event);
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !ALLOWED_LINK_HOSTS.has(parsed.hostname)) throw new Error("Enlace no permitido");
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
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  registerIpc();
  createWindow();
  const settings = readSettings();
  if (app.isPackaged && settings.autoCheckLauncher) {
    setTimeout(() => void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined), 8_000);
  }
});

app.on("window-all-closed", () => app.quit());
