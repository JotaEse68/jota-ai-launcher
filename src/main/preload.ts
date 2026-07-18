import { contextBridge, ipcRenderer } from "electron";
import type { Language, LauncherBridge, LauncherSettings, ToolAction, ToolId } from "../shared/types";

const bridge: LauncherBridge = {
  scan: (includeLatest = false) => ipcRenderer.invoke("launcher:scan", includeLatest),
  getSettings: () => ipcRenderer.invoke("launcher:settings:get"),
  saveSettings: (settings: LauncherSettings) => ipcRenderer.invoke("launcher:settings:save", settings),
  selectProject: (language: Language) => ipcRenderer.invoke("launcher:project:select", language),
  runAction: (tool: ToolId, action: ToolAction, projectPath: string, language: Language) =>
    ipcRenderer.invoke("launcher:action", tool, action, projectPath, language),
  openLink: (url: string) => ipcRenderer.invoke("launcher:link", url),
  checkLauncherUpdate: (language: Language) => ipcRenderer.invoke("launcher:update:self", language),
};

contextBridge.exposeInMainWorld("launcher", bridge);
