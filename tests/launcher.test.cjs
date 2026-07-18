const test = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { TOOL_DEFINITIONS, TOOL_IDS } = require("../dist/main/definitions.js");
const { buildSnapshot, discoverProjects, normalizeSettings } = require("../dist/main/services.js");

test("define los tres agentes sin credenciales incrustadas", () => {
  assert.deepEqual(TOOL_IDS, ["codex", "claude", "opencode"]);
  for (const id of TOOL_IDS) {
    const tool = TOOL_DEFINITIONS[id];
    assert.equal(tool.id, id);
    assert.match(tool.docsUrl, /^https:\/\//);
    assert.match(tool.downloadUrl, /^https:\/\//);
    assert.ok(tool.command);
    assert.ok(tool.packageName);
    assert.equal("apiKey" in tool, false);
    assert.equal("password" in tool, false);
  }
});

test("descubre proyectos reales y omite dependencias", () => {
  const root = mkdtempSync(join(tmpdir(), "jota-project-library-"));
  try {
    const app = join(root, "mi-aplicacion");
    const dependency = join(root, "node_modules", "paquete");
    mkdirSync(app, { recursive: true });
    mkdirSync(dependency, { recursive: true });
    writeFileSync(join(app, "package.json"), '{"name":"mi-aplicacion"}');
    writeFileSync(join(dependency, "package.json"), '{"name":"paquete"}');
    const projects = discoverProjects([root]);
    assert.equal(projects.length, 1);
    assert.equal(projects[0].name, "mi-aplicacion");
    assert.equal(projects[0].kind, "javascript");
    assert.equal(projects[0].marker, "package.json");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("normaliza ajustes y descarta rutas o tipos no confiables", () => {
  const root = mkdtempSync(join(tmpdir(), "jota-settings-"));
  try {
    const defaults = {
      projectPath: root,
      autoCheckTools: true,
      autoCheckLauncher: true,
      startWithWindows: false,
      language: "es",
      projectRoots: [],
    };
    const normalized = normalizeSettings({
      projectPath: join(root, "missing"),
      autoCheckTools: "yes",
      autoCheckLauncher: false,
      startWithWindows: 1,
      language: "invalid",
      projectRoots: [root, root, join(root, "missing"), 42],
    }, defaults);

    assert.equal(normalized.projectPath, root);
    assert.equal(normalized.autoCheckTools, true);
    assert.equal(normalized.autoCheckLauncher, false);
    assert.equal(normalized.startWithWindows, false);
    assert.equal(normalized.language, "en");
    assert.deepEqual(normalized.projectRoots, [root]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("produce un diagnóstico rápido con estructura estable", async () => {
  const snapshot = await buildSnapshot(false);
  assert.equal(snapshot.tools.length, 3);
  assert.ok(["Windows Terminal", "PowerShell", "Terminal"].includes(snapshot.shell));
  assert.ok(["windows", "macos", "other"].includes(snapshot.platform));
  assert.equal(typeof snapshot.nodeInstalled, "boolean");
  for (const tool of snapshot.tools) {
    assert.ok(TOOL_IDS.includes(tool.id));
    assert.equal(Array.isArray(tool.plugins), true);
    assert.equal(Array.isArray(tool.skills), true);
  }
});
