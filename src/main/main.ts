import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { LauncherSettings, ToolAction, ToolId } from "../shared/types";
import { buildSnapshot, openToolTerminal, readSettings, writeSettings } from "./services";

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
]);

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
    },
  });

  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  const screenshotPath = process.env.LAUNCHER_SCREENSHOT_PATH;
  if (screenshotPath) {
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
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
  ipcMain.handle("launcher:scan", async (_event, includeLatest: boolean) => {
    const startedAt = Date.now();
    const snapshot = await buildSnapshot(Boolean(includeLatest));
    console.log(`[launcher] scan ${includeLatest ? "complete" : "rápido"}: ${Date.now() - startedAt} ms`);
    return snapshot;
  });
  ipcMain.handle("launcher:settings:get", () => readSettings());
  ipcMain.handle("launcher:settings:save", (_event, settings: LauncherSettings) => writeSettings(settings));
  ipcMain.handle("launcher:project:select", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: "Elige la carpeta del proyecto",
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle("launcher:action", (_event, tool: ToolId, action: ToolAction, projectPath: string) => {
    if (!VALID_TOOLS.has(tool) || !VALID_ACTIONS.has(action)) throw new Error("Acción no permitida");
    return openToolTerminal(tool, action, projectPath);
  });
  ipcMain.handle("launcher:link", async (_event, url: string) => {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !ALLOWED_LINK_HOSTS.has(parsed.hostname)) throw new Error("Enlace no permitido");
    await shell.openExternal(parsed.toString());
  });
  ipcMain.handle("launcher:update:self", async () => {
    if (!app.isPackaged) return { ok: true, message: "El actualizador se activa en la versión instalada." };
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      return { ok: true, message: result?.updateInfo.version === app.getVersion() ? "Jota AI Launcher está al día." : "Actualización comprobada." };
    } catch {
      return { ok: false, message: "El canal público de actualizaciones se activará al publicar la primera versión." };
    }
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  const settings = readSettings();
  if (app.isPackaged && settings.autoCheckLauncher) {
    setTimeout(() => void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined), 8_000);
  }
});

app.on("window-all-closed", () => app.quit());
