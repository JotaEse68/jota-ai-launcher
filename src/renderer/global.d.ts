import type { LauncherBridge } from "../shared/types";

declare module "*.css";

declare global {
  interface Window {
    launcher: LauncherBridge;
  }
}

export {};
