import { contextBridge, ipcRenderer } from "electron";
import type { LauncherBridge, LauncherSettings, ToolAction, ToolId } from "../shared/types";

const bridge: LauncherBridge = {
  scan: (includeLatest = false) => ipcRenderer.invoke("launcher:scan", includeLatest),
  getSettings: () => ipcRenderer.invoke("launcher:settings:get"),
  saveSettings: (settings: LauncherSettings) => ipcRenderer.invoke("launcher:settings:save", settings),
  selectProject: () => ipcRenderer.invoke("launcher:project:select"),
  runAction: (tool: ToolId, action: ToolAction, projectPath: string) =>
    ipcRenderer.invoke("launcher:action", tool, action, projectPath),
  openLink: (url: string) => ipcRenderer.invoke("launcher:link", url),
  checkLauncherUpdate: () => ipcRenderer.invoke("launcher:update:self"),
};

contextBridge.exposeInMainWorld("launcher", bridge);
