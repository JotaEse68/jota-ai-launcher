const test = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { TOOL_DEFINITIONS, TOOL_IDS } = require("../dist/main/definitions.js");
const { buildSnapshot, discoverProjects, normalizeSettings, scanCleanupDirectory } = require("../dist/main/services.js");
const { isProjectHidden } = require("../dist/shared/types.js");

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

test("exige la URL exacta del autor y rechaza dominios engañosos", async () => {
  const { AUTHOR_URL, isExactPublicUrl } = await import("../scripts/site-url-policy.mjs");
  assert.equal(isExactPublicUrl("https://jsantos.pro/", AUTHOR_URL), true);
  assert.equal(isExactPublicUrl("https://jsantos.pro.evil.example/", AUTHOR_URL), false);
  assert.equal(isExactPublicUrl("https://evil.example/?next=https://jsantos.pro/", AUTHOR_URL), false);
  assert.equal(isExactPublicUrl("https://jsantos.pro@evil.example/", AUTHOR_URL), false);
  assert.equal(isExactPublicUrl("javascript:https://jsantos.pro/", AUTHOR_URL), false);
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

test("detecta el enlace público y clasifica apps y plugins", () => {
  const root = mkdtempSync(join(tmpdir(), "jota-public-links-"));
  try {
    const web = join(root, "panel-publico");
    const plugin = join(root, "mi-plugin");
    mkdirSync(web, { recursive: true });
    mkdirSync(plugin, { recursive: true });
    writeFileSync(join(web, "package.json"), JSON.stringify({ name: "panel-publico", homepage: "https://panel-publico.vercel.app", dependencies: { next: "latest", react: "latest" } }));
    writeFileSync(join(plugin, "mi-plugin.php"), "<?php\n/* Plugin Name: Mi Plugin */");
    const projects = discoverProjects([root]);
    const foundWeb = projects.find((project) => project.name === "panel-publico");
    const foundPlugin = projects.find((project) => project.name === "mi-plugin");
    assert.equal(foundWeb.publicUrl, "https://panel-publico.vercel.app/");
    assert.equal(foundWeb.deploymentService, "Vercel");
    assert.equal(foundWeb.projectType, "web-app");
    assert.equal(foundPlugin.projectType, "plugin");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("separa residuos seguros, revisables y protegidos sin borrar nada", () => {
  const root = mkdtempSync(join(tmpdir(), "jota-cleanup-"));
  try {
    mkdirSync(join(root, "node_modules", "package"), { recursive: true });
    mkdirSync(join(root, "dist"), { recursive: true });
    mkdirSync(join(root, "carpeta-vacia"), { recursive: true });
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "node_modules", "package", "index.js"), "x".repeat(2048));
    writeFileSync(join(root, "dist", "bundle.js"), "x".repeat(1024));
    writeFileSync(join(root, "src", "app.js"), "código importante");
    const report = scanCleanupDirectory(root);
    assert.equal(report.items.find((item) => item.name === "node_modules").recommendation, "safe");
    assert.equal(report.items.find((item) => item.name === "dist").recommendation, "review");
    assert.equal(report.items.find((item) => item.name === "carpeta-vacia").kind, "empty");
    assert.equal(report.items.find((item) => item.name === "src").recommendation, "keep");
    assert.ok(report.recoverableBytes >= 3072);
    assert.equal(require("node:fs").existsSync(join(root, "node_modules", "package", "index.js")), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("normaliza ajustes y descarta rutas o tipos no confiables", () => {
  const root = mkdtempSync(join(tmpdir(), "jota-settings-"));
  try {
    const projectPaths = ["one", "two", "three", "four"].map((name) => {
      const path = join(root, name);
      mkdirSync(path);
      return path;
    });
    const defaults = {
      projectPath: root,
      autoCheckTools: true,
      autoCheckLauncher: true,
      startWithWindows: false,
      language: "es",
      projectRoots: [],
      projectPlans: {},
    };
    const normalized = normalizeSettings({
      projectPath: join(root, "missing"),
      autoCheckTools: "yes",
      autoCheckLauncher: false,
      startWithWindows: 1,
      language: "invalid",
      projectRoots: [root, root, join(root, "missing"), 42],
      projectPlans: Object.fromEntries(projectPaths.map((path, index) => [path, {
        phase: index === 0 ? "invalid" : index === 3 ? "abandoned" : "building",
        deadline: index === 1 ? "not-a-date" : index === 2 ? "2026-99-99" : "2026-12-01",
        nextAction: "  paso verificable  ",
        definitionOfDone: "  publicado  ",
        focus: true,
        updatedAt: "invalid",
        lastSessionSummary: "  sesión cerrada  ",
        blocker: "  API pendiente  ",
        lastSessionAt: "2026-07-21T10:00:00.000Z",
        abandonedReason: "  ya no aporta valor  ",
        lessonLearned: "  validar antes  ",
      }])),
    }, defaults);

    assert.equal(normalized.projectPath, root);
    assert.equal(normalized.autoCheckTools, true);
    assert.equal(normalized.autoCheckLauncher, false);
    assert.equal(normalized.startWithWindows, false);
    assert.equal(normalized.language, "en");
    assert.deepEqual(normalized.projectRoots, [root]);
    assert.equal(normalized.projectPlans[projectPaths[0]].phase, "backlog");
    assert.equal(normalized.projectPlans[projectPaths[1]].deadline, "");
    assert.equal(normalized.projectPlans[projectPaths[2]].deadline, "");
    assert.equal(normalized.projectPlans[projectPaths[0]].nextAction, "paso verificable");
    assert.equal(Object.values(normalized.projectPlans).filter((plan) => plan.focus).length, 3);
    assert.equal(normalized.projectPlans[projectPaths[0]].lastSessionSummary, "sesión cerrada");
    assert.equal(normalized.projectPlans[projectPaths[3]].phase, "abandoned");
    assert.equal(normalized.projectPlans[projectPaths[3]].focus, false);
    assert.equal(normalized.projectPlans[projectPaths[3]].lessonLearned, "validar antes");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("conserva tarjetas ocultas y enlaces públicos después de recargar ajustes", () => {
  const root = mkdtempSync(join(tmpdir(), "jota-hidden-projects-"));
  try {
    const project = join(root, "Proyecto Persistente");
    mkdirSync(project);
    const defaults = {
      projectPath: root,
      autoCheckTools: true,
      autoCheckLauncher: true,
      startWithWindows: false,
      language: "es",
      projectRoots: [root],
      projectPlans: {},
      projectLinks: {},
      hiddenProjects: [],
    };
    const saved = normalizeSettings({
      ...defaults,
      hiddenProjects: [project, project],
      projectLinks: { [project]: "https://proyecto-persistente.vercel.app" },
    }, defaults);
    const restoredAfterUpdate = normalizeSettings(JSON.parse(JSON.stringify(saved)), defaults);

    assert.deepEqual(restoredAfterUpdate.hiddenProjects, [project]);
    assert.equal(restoredAfterUpdate.projectLinks[project], "https://proyecto-persistente.vercel.app/");
    assert.equal(isProjectHidden(project.toUpperCase(), restoredAfterUpdate.hiddenProjects), true);
    assert.equal(isProjectHidden(join(root, "Proyecto Nuevo"), restoredAfterUpdate.hiddenProjects), false);
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
