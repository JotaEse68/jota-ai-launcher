<div align="center">

# Jota AI Launcher

### Codex, Claude Code, and OpenCode. All your projects. One dashboard.

[![Español](https://img.shields.io/badge/IDIOMA-ESPAÑOL-344254?style=for-the-badge)](./README.md)
[![English](https://img.shields.io/badge/LANGUAGE-ENGLISH-2855d9?style=for-the-badge)](./README.en.md)

[![CI](https://github.com/JotaEse68/jota-ai-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/JotaEse68/jota-ai-launcher/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/JotaEse68/jota-ai-launcher?display_name=tag)](https://github.com/JotaEse68/jota-ai-launcher/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/JotaEse68/jota-ai-launcher/total.svg)](https://github.com/JotaEse68/jota-ai-launcher/releases)
[![MIT License](https://img.shields.io/badge/license-MIT-16846b.svg)](./LICENSE)

A local, multilingual, open-source desktop application for Windows and macOS.

[Download the latest release](https://github.com/JotaEse68/jota-ai-launcher/releases/latest) · [Verify a download](#verify-a-downloaded-file) · [Report a vulnerability](https://github.com/JotaEse68/jota-ai-launcher/security/advisories/new)

</div>

![Jota AI Launcher main dashboard](./launcher-home.png)

## What is Jota AI Launcher?

Jota AI Launcher brings **Codex**, **Claude Code**, and **OpenCode** into a single desktop application. It detects installed tools, launches each agent in the correct folder, displays versions, accounts, plugins, skills, and MCP servers, and maintains a visual library of your local projects.

The launcher does not replace the agents or proxy communication between them and their providers. Its job is to provide a clear and secure entry point: choose a project, choose an agent, and get a terminal that is ready to work.

### Highlights

- One interface for Codex, Claude Code, and OpenCode.
- Visual project library with clickable cards.
- Automatic detection of versions, accounts, plugins, skills, and MCP servers.
- Installation and updates through each CLI's official commands.
- Spanish, English, French, Portuguese, Italian, and German.
- Windows and macOS support.
- No proprietary server, advertising, analytics, or telemetry.
- No passwords, API keys, or user accounts embedded in the installer.
- Public source, builds, checksums, SBOMs, and provenance.

## Download and installation

Always download Jota AI Launcher from the official [GitHub Releases page](https://github.com/JotaEse68/jota-ai-launcher/releases/latest).

| Operating system | File | Compatibility | Terminal used |
|---|---|---|---|
| Windows | `Jota-AI-Launcher-Setup-*.exe` | Windows 10/11 x64 | Windows Terminal or PowerShell |
| macOS | `Jota-AI-Launcher-*-universal.dmg` | Intel and Apple Silicon Macs | Terminal |

### Windows

1. Open the [latest release](https://github.com/JotaEse68/jota-ai-launcher/releases/latest).
2. Download `Jota-AI-Launcher-Setup-*.exe`.
3. Verify its checksum or provenance using the instructions below.
4. Run the installer and choose an installation location.
5. Open **Jota AI Launcher** from the desktop or Start menu.

The installer creates shortcuts and installs the application for the current user only. A normal installation does not require administrator privileges.

### macOS

1. Open the [latest release](https://github.com/JotaEse68/jota-ai-launcher/releases/latest).
2. Download `Jota-AI-Launcher-*-universal.dmg`.
3. Verify its SHA-256 checksum and provenance before opening it.
4. Mount the `.dmg` and move **Jota AI Launcher** to Applications.
5. Start the application from Applications.

> **Signing notice:** the installers do not yet have commercial Microsoft and Apple code-signing certificates. Windows SmartScreen may show “Unknown publisher,” and macOS Gatekeeper may prevent the first launch. Download only from this repository and complete the verification steps. Signing and notarization are planned for future releases.

## Quick start

1. Open the launcher. It checks local tools and projects.
2. Open **Projects** and choose a card, or manually select a folder from **Launch**.
3. If an agent is missing, click **Install**. The launcher opens a terminal with its official command.
4. Open **Accounts** and sign in directly with the relevant provider.
5. Click **Start** or **Resume session** for Codex, Claude Code, or OpenCode.

The terminal opens inside the selected project. Each agent retains its own permissions, history, settings, and credentials.

## Visual project library

The **Projects** section scans common development locations and turns detected code folders into clickable cards.

![Visual project library](./projects-library.png)

### Available actions

- **Use project:** makes the folder the active project and returns to the launch dashboard.
- **Open folder:** opens the project in Windows Explorer or Finder.
- **Add folder:** includes another root folder where you keep projects.
- **Remove folder:** stops scanning a manually added location.
- **Find projects:** scans configured folders again.

### Detected technologies

| Technology | File or marker |
|---|---|
| JavaScript / TypeScript | `package.json` |
| Python | `pyproject.toml` or `requirements.txt` |
| Rust | `Cargo.toml` |
| Go | `go.mod` |
| .NET | `.sln` or `.csproj` |
| PHP | `composer.json` |
| Ruby | `Gemfile` |
| Other repositories | `.git` |

The scan skips dependencies and generated output such as `node_modules`, `dist`, `build`, `release`, `.next`, `.nuxt`, `.venv`, `vendor`, `target`, `coverage`, and `.git`. Detected project names and paths stay on the computer.

## Supported tools

| Tool | Official package | Start | Resume |
|---|---|---|---|
| Codex | `@openai/codex` | `codex` | `codex resume` |
| Claude Code | `@anthropic-ai/claude-code` | `claude` | `claude --resume` |
| OpenCode | `opencode-ai` | `opencode` | `opencode --continue` |

Jota AI Launcher can:

- Detect whether each command is available.
- Display the installed version and look up the latest published version.
- Open installation, update, sign-in, and sign-out commands in a visible terminal.
- Read the general authentication status reported by each CLI.
- Inventory plugins, skills, and MCP servers when supported by the tool.
- Open official documentation and account-management pages.

The tools are not bundled with the launcher. To install them through `npm`, you need a compatible version of **Node.js and npm**.

## Accounts and credentials

Each agent manages its own account. The launcher has no form for entering passwords or API keys, and it never copies credentials between tools.

- Codex stores its session in the user's profile according to its official CLI.
- Claude Code stores access according to its official CLI.
- OpenCode stores providers and credentials according to its official configuration.
- When the installer is shared, the other person starts without your accounts.
- A separate operating-system account is recommended for each person on a shared computer.

## Languages

The interface is available in:

- Español
- English
- Français
- Português
- Italiano
- Deutsch

A new installation uses the system language when it is supported. The language can then be changed from the top selector, and the preference is stored locally. Technical output from each CLI may use the language configured by its provider.

## Application sections

| Section | Purpose |
|---|---|
| Launch | Choose the active project and start an agent |
| Projects | Browse the local project library |
| Accounts | View access status and open sign-in/sign-out flows |
| Inventory | Inspect plugins, skills, and MCP servers |
| Updates | Compare versions and open official updaters |
| Guide & settings | Preferences, launch at login, and official links |

## Privacy

Jota AI Launcher runs locally. It has no proprietary backend, remote database, advertising, analytics, or usage telemetry.

| Information it may read locally | Information it does not collect |
|---|---|
| Presence and version of the three CLIs | Passwords |
| Node.js and the available terminal | API keys |
| General authentication status | Session tokens |
| Names and paths of detected projects | Project source code |
| Installed plugins, skills, and MCP servers | Conversation content |
| Launcher preferences | Account email addresses |

This inventory is not transmitted to Jota or to a project-owned server. When an agent runs, communication happens directly between that CLI and its provider. See the [privacy policy](./PRIVACY.md).

## Security and trust

No single scan can guarantee that an application is malware-free. Releases therefore combine several verifiable controls:

- **Open source:** the complete source code is available in this repository.
- **Public builds:** Windows and macOS packages are built by GitHub Actions.
- **Public tests:** every change is checked on both operating systems.
- **Provenance attestations:** each installer is linked to the workflow and commit that produced it.
- **SHA-256:** `SHA256SUMS.txt` detects modified files.
- **SBOM:** every release includes a CycloneDX dependency inventory.
- **Independent scanning:** public installers can be checked with Microsoft Defender or [VirusTotal](https://www.virustotal.com/gui/home/upload).
- **Private reporting:** vulnerabilities can be submitted through [GitHub Security Advisories](https://github.com/JotaEse68/jota-ai-launcher/security/advisories/new).

### Verify a downloaded file

Windows PowerShell:

```powershell
Get-FileHash -Algorithm SHA256 ".\Jota-AI-Launcher-Setup-0.3.0.exe"
Get-Content ".\SHA256SUMS.txt"
gh attestation verify ".\Jota-AI-Launcher-Setup-0.3.0.exe" --repo JotaEse68/jota-ai-launcher
```

macOS Terminal:

```shell
shasum -a 256 Jota-AI-Launcher-0.3.0-universal.dmg
cat SHA256SUMS.txt
gh attestation verify Jota-AI-Launcher-0.3.0-universal.dmg --repo JotaEse68/jota-ai-launcher
```

The calculated value must match `SHA256SUMS.txt`. An attestation proves where a file came from; it does not replace a security review. See the Spanish [download verification guide](./docs/VERIFICAR.md) and [security policy](./SECURITY.md) for more details.

## Architecture

```mermaid
flowchart LR
    U[User] --> R[React renderer]
    R -->|Limited API| P[Electron preload]
    P --> M[Main process]
    M --> F[Local file system]
    M --> T[Visible terminal]
    T --> C[Codex]
    T --> A[Claude Code]
    T --> O[OpenCode]
    M --> G[GitHub Releases]
```

- The renderer has no direct access to Node.js.
- Electron context isolation and sandboxing are enabled.
- The preload exposes only specific operations through `contextBridge`.
- Tool actions are restricted to a known list of commands.
- External links are restricted to official domains.
- Folder selection uses native operating-system dialogs.

## Updates

The launcher handles two update categories:

1. **Tools:** it checks Codex, Claude Code, and OpenCode versions. Updating opens a visible terminal with the official command.
2. **Application:** `electron-updater` checks this repository's public releases and notifies the user when a new version is available.

Tool installers are never run invisibly.

## Local development

### Requirements

- Node.js and npm.
- Windows or macOS.
- Git for cloning the repository.

### Setup

```shell
git clone https://github.com/JotaEse68/jota-ai-launcher.git
cd jota-ai-launcher
npm install
npm run dev
```

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite and Electron in development mode |
| `npm run typecheck` | Check TypeScript for the main and renderer processes |
| `npm test` | Build the main process and run tests |
| `npm run build` | Create a production build |
| `npm run dist:win` | Create the Windows NSIS installer |
| `npm run dist:mac` | Create universal macOS `.dmg` and `.zip` packages |

### Project structure

```text
src/
├── main/       Main process, terminals, scanning, and updates
├── renderer/   React interface, styles, and translations
└── shared/     Types for the secure bridge between both processes
tests/          Tool and project-discovery tests
docs/           Download verification guides
.github/        CI, releases, and dependency updates
```

## Release pipeline

Every `v*` tag starts a public workflow that:

1. Installs dependencies with `npm ci`.
2. Runs tests and TypeScript checks.
3. Builds the `.exe` on a Windows runner.
4. Builds the universal `.dmg` on a macOS runner.
5. Generates a CycloneDX SBOM.
6. Creates provenance attestations.
7. Calculates SHA-256 checksums.
8. Publishes all assets to GitHub Releases.

## Troubleshooting

### A tool is missing

Check that its command works in a new terminal:

```shell
codex --version
claude --version
opencode --version
```

If you just installed the tool, restart the launcher so it receives the updated `PATH`.

### A project is missing

- Select **Projects → Add folder** and choose the directory that contains your projects.
- Make sure the project contains a supported marker file.
- Click **Find projects** after creating or moving folders.
- Generated and dependency folders are intentionally ignored.

### The terminal opens in the wrong folder

Return to **Projects**, click **Use project** on the correct card, and then launch the agent.

### Windows or macOS displays a warning

Download only from Releases, compare the SHA-256 checksum, verify the attestation, and scan the file. The application does not yet have commercial code-signing certificates.

### An account appears disconnected

Open **Accounts** and start the sign-in flow. Authentication happens in the provider's official terminal flow, not inside the launcher.

## Frequently asked questions

### Does the installer contain the developer's accounts?

No. Every installation starts without another person's accounts, and every CLI manages its own credentials.

### Do I need API keys?

That depends on the tool and provider you choose. The launcher itself neither requires nor stores an API key.

### Does it read my project source code?

It does not analyze source-code contents. Project discovery checks only marker filenames and folder paths.

### Does it work offline?

The project library and local inventory work offline. Installation, updates, sign-in, and model use require the connectivity expected by each provider.

### Can I share the installer?

Yes. Prefer sharing the official release link so each person can verify provenance and receive future updates.

## Contributing and support

- Open an [issue](https://github.com/JotaEse68/jota-ai-launcher/issues) for bugs or feature requests.
- Use the [private security channel](https://github.com/JotaEse68/jota-ai-launcher/security/advisories/new) for vulnerabilities.
- Before submitting changes, run `npm test`, `npm run build`, and the dependency audit.
- Never post credentials, tokens, private paths, or exploitable details in public issues.

## Official sources

- [Codex CLI](https://developers.openai.com/codex/cli/)
- [Claude Code](https://code.claude.com/docs/en/setup)
- [OpenCode](https://opencode.ai/docs/)
- [Jota AI Launcher GitHub Releases](https://github.com/JotaEse68/jota-ai-launcher/releases)

## License

Jota AI Launcher is distributed under the [MIT License](./LICENSE).

---

<div align="center">

Built to open the right project with the right agent—without sharing your credentials.

[⬆ Back to top](#jota-ai-launcher)

</div>
