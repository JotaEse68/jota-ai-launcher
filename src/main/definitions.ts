import type { ToolId } from "../shared/types";

export interface ToolDefinition {
  id: ToolId;
  name: string;
  subtitle: string;
  command: string;
  packageName: string;
  accent: string;
  docsUrl: string;
  downloadUrl: string;
  accountUrl: string;
}

export const TOOL_DEFINITIONS: Record<ToolId, ToolDefinition> = {
  codex: {
    id: "codex",
    name: "Codex",
    subtitle: "Agente de OpenAI",
    command: "codex",
    packageName: "@openai/codex",
    accent: "#2855d9",
    docsUrl: "https://learn.chatgpt.com/docs/codex/cli",
    downloadUrl: "https://developers.openai.com/codex/cli/",
    accountUrl: "https://chatgpt.com/",
  },
  claude: {
    id: "claude",
    name: "Claude Code",
    subtitle: "Agente de Anthropic",
    command: "claude",
    packageName: "@anthropic-ai/claude-code",
    accent: "#c26a3d",
    docsUrl: "https://code.claude.com/docs/en/quickstart",
    downloadUrl: "https://code.claude.com/docs/en/setup",
    accountUrl: "https://claude.ai/",
  },
  opencode: {
    id: "opencode",
    name: "OpenCode",
    subtitle: "Agente abierto multimodelo",
    command: "opencode",
    packageName: "opencode-ai",
    accent: "#16846b",
    docsUrl: "https://opencode.ai/docs/",
    downloadUrl: "https://opencode.ai/docs/",
    accountUrl: "https://opencode.ai/auth",
  },
};

export const TOOL_IDS: ToolId[] = ["codex", "claude", "opencode"];
