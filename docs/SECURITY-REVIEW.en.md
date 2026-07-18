# Security review · Jota AI Launcher 0.4.0

[Español](./SECURITY-REVIEW.md) · [English](./SECURITY-REVIEW.en.md)

**Date:** July 18, 2026

**Scope:** source code, Electron configuration, preload/IPC bridge, project library, bilingual landing, local paths and commands, dependencies, build, and release.

**Method:** manual static review, automated tests, strict TypeScript, npm audit, secret scanning, and GitHub CodeQL analysis.

## Executive result

After the remediations below, no known critical or high-severity findings remained within the reviewed scope. The application keeps a local, least-privilege architecture: the renderer is isolated and cannot directly choose scan roots or the folder passed to a command.

This review improves confidence but does not certify that the software is invulnerable or malware-free. Installers are still commercially unsigned, so users should verify their SHA-256 checksum and GitHub provenance attestation.

## Verified controls

| Area | Control |
|---|---|
| Renderer | `nodeIntegration: false`, `contextIsolation: true`, sandbox, and `webSecurity` enabled |
| Navigation | new windows, navigation, `webview` attachment, and web permissions denied |
| CSP | scripts, images, connections, forms, and objects explicitly restricted |
| IPC | accepts messages only from the main window; tools and actions use allowlists |
| Paths | normalized settings; folders approved through native dialogs or scans of stored roots |
| Library | bounded README/manifest reads; symbolic links cannot escape approved roots |
| Commands | fixed internal commands; renderer-provided paths are not interpolated into commands |
| Links | HTTPS only and explicitly allowed domains |
| Credentials | no API-key forms and no bundled secrets |
| Releases | checksums, CycloneDX SBOM, and build provenance attestation |
| CI | actions pinned by commit, per-job permissions, npm audit, and CodeQL |
| Landing | author URLs normalized and compared exactly; local links and assets validated |

## Remediations applied

1. Removed renderer control over scan roots and the project path sent to terminals.
2. Added an approved-directory capability list and sender validation to every IPC operation.
3. Added type, language, directory existence, duplicate, and root-count validation for persisted settings.
4. Denied web permissions, navigation, pop-ups, and `webview`; DevTools is disabled in packaged builds.
5. Hardened CSP and retained an HTTPS allowlist for external links.
6. Replaced `latest` development dependencies with versioned ranges while retaining the lockfile as the reproducible source.
7. Pinned GitHub Actions by SHA and reduced workflow permissions per job.
8. Expanded dependency auditing and added CodeQL on changes and on a weekly schedule.
9. Added a regression test that rejects untrusted settings and paths.
10. Limited project-memory metadata reads and blocked symbolic-link traversal outside approved folders.
11. Changed landing validation to parse real URLs and reject deceptive subdomains, embedded credentials, misleading query strings, and disallowed schemes.

## Validation evidence

| Check | Result on 2026-07-18 |
|---|---|
| `npm run build` | passed, including strict TypeScript and production build |
| `npm test` | 6 of 6 tests passed |
| `npm audit --audit-level=high` | 0 known vulnerabilities |
| Credential-pattern scan | no matches |
| Windows and macOS CI | passed in GitHub Actions |
| CodeQL | no open critical or high alerts in the reviewed version |

CodeQL runs on GitHub for each push and pull request; its public status is shown in the README. The local installer and the GitHub-built installer are not necessarily identical, so users must always verify the downloaded release's own checksum.

## Residual risks

| Risk | Level | Treatment |
|---|---:|---|
| No commercial installer signing/notarization | Medium | download from Releases and verify checksum + attestation; signing is planned |
| npm dependencies and external tools | Low–medium | lockfile, audit, Dependabot, SBOM, and CodeQL |
| CLI access to the selected project | Expected | visible terminal and each agent's own controls |
| Local project-path metadata | Low | stored locally; the launcher has no telemetry |

## Out of scope

- Internal security of Codex, Claude Code, OpenCode, npm, or remote models.
- Plugins, extensions, or skills installed by the user.
- An already compromised operating system or user account.
- Independent third-party certification or a formal penetration test.

## Recommended verification

Before installing a release, follow [How to verify a download](./VERIFICAR.md). To report a vulnerability privately, use [GitHub Security Advisories](https://github.com/JotaEse68/jota-ai-launcher/security/advisories/new).
