const test = require("node:test");
const assert = require("node:assert/strict");
const { TOOL_DEFINITIONS, TOOL_IDS } = require("../dist/main/definitions.js");
const { buildSnapshot } = require("../dist/main/services.js");

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

test("produce un diagnóstico rápido con estructura estable", async () => {
  const snapshot = await buildSnapshot(false);
  assert.equal(snapshot.tools.length, 3);
  assert.ok(["Windows Terminal", "PowerShell"].includes(snapshot.shell));
  assert.equal(typeof snapshot.nodeInstalled, "boolean");
  for (const tool of snapshot.tools) {
    assert.ok(TOOL_IDS.includes(tool.id));
    assert.equal(Array.isArray(tool.plugins), true);
    assert.equal(Array.isArray(tool.skills), true);
  }
});
