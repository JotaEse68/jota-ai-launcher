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

test("resume README, stack, repositorio y despliegue, e incluye plugins locales", () => {
  const root = mkdtempSync(join(tmpdir(), "jota-project-memory-"));
  try {
    const dashboard = join(root, "dashboard-ia");
    const plugin = join(root, "Plugins", "jota-helper");
    writeFileSync(join(root, "package.json"), '{"name":"carpeta-contenedora"}');
    mkdirSync(join(dashboard, ".git"), { recursive: true });
    mkdirSync(plugin, { recursive: true });
    writeFileSync(join(dashboard, "README.md"), "# Dashboard IA\n\nPanel interno para organizar campañas, revisar resultados y retomar rápidamente el trabajo pendiente del equipo.\n");
    writeFileSync(join(dashboard, "package.json"), JSON.stringify({
      name: "dashboard-ia",
      description: "Fallback package description",
      dependencies: { next: "latest", react: "latest", "@supabase/supabase-js": "latest" },
      devDependencies: { typescript: "latest", tailwindcss: "latest" },
    }));
    writeFileSync(join(dashboard, "tsconfig.json"), "{}");
    writeFileSync(join(dashboard, "vercel.json"), "{}");
    writeFileSync(join(dashboard, ".git", "config"), "[remote \"origin\"]\n\turl = git@github.com:JotaEse68/dashboard-ia.git\n");
    writeFileSync(join(plugin, "README.md"), "# Jota Helper\n\nPlugin local creado con inteligencia artificial para automatizar tareas editoriales dentro de WordPress.\n");
    writeFileSync(join(plugin, "jota-helper.php"), "<?php\n/*\nPlugin Name: Jota Helper\nDescription: Automatiza tareas editoriales.\n*/\n");

    const projects = discoverProjects([root]);
    const foundDashboard = projects.find((project) => project.name === "dashboard-ia");
    const foundPlugin = projects.find((project) => project.name === "jota-helper");

    assert.ok(foundDashboard);
    assert.match(foundDashboard.description, /Panel interno/);
    assert.deepEqual(foundDashboard.services.sort(), ["GitHub", "Supabase", "Vercel"]);
    assert.equal(foundDashboard.repositoryUrl, "https://github.com/JotaEse68/dashboard-ia");
    assert.ok(foundDashboard.technologies.includes("Next.js"));
    assert.ok(foundDashboard.technologies.includes("TypeScript"));
    assert.ok(foundDashboard.technologies.includes("Tailwind CSS"));

    assert.ok(foundPlugin);
    assert.equal(foundPlugin.source, "folder");
    assert.equal(foundPlugin.kind, "php");
    assert.equal(foundPlugin.repositoryUrl, undefined);
    assert.ok(foundPlugin.technologies.includes("WordPress Plugin"));
    assert.match(foundPlugin.description, /Plugin local/);
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
