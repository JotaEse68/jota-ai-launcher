import { useEffect, useMemo, useState } from "react";
import type { LauncherSettings, LauncherSnapshot, ToolAction, ToolId, ToolStatus } from "../shared/types";

type View = "launch" | "accounts" | "inventory" | "updates" | "help";

const EMPTY_SETTINGS: LauncherSettings = {
  projectPath: "",
  autoCheckTools: true,
  autoCheckLauncher: true,
  startWithWindows: false,
};

const NAV: Array<{ id: View; label: string; glyph: string }> = [
  { id: "launch", label: "Lanzar", glyph: "▶" },
  { id: "accounts", label: "Cuentas", glyph: "◎" },
  { id: "inventory", label: "Inventario", glyph: "▦" },
  { id: "updates", label: "Actualizaciones", glyph: "↻" },
  { id: "help", label: "Guía y ajustes", glyph: "?" },
];

function shortPath(path: string): string {
  if (path.length < 58) return path;
  const parts = path.split("\\");
  return `${parts.slice(0, 2).join("\\")}\\…\\${parts.slice(-2).join("\\")}`;
}

function StatusLight({ ok }: { ok: boolean }) {
  return <span className={`status-light ${ok ? "is-ok" : "is-off"}`} aria-hidden="true" />;
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 46 46" aria-hidden="true">
      <path d="M8 6h30v24L26 40H8z" fill="currentColor" />
      <path d="M18 14v13.5c0 3.2-1.4 4.8-4.5 4.8" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <path d="m26 14 7 8-7 8" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ToolCard({ tool, onAction }: { tool: ToolStatus; onAction: (id: ToolId, action: ToolAction) => void }) {
  return (
    <article className="tool-card" style={{ "--tool-accent": tool.accent } as React.CSSProperties}>
      <div className="tool-card-head">
        <div className="tool-monogram">{tool.id === "codex" ? "CX" : tool.id === "claude" ? "CL" : "OC"}</div>
        <div>
          <h3>{tool.name}</h3>
          <p>{tool.subtitle}</p>
        </div>
        <span className={`tool-state ${tool.installed ? "ready" : "missing"}`}>
          <StatusLight ok={tool.installed} /> {tool.installed ? tool.version || "Listo" : "No instalado"}
        </span>
      </div>
      <div className="signal-track"><span style={{ width: tool.installed ? (tool.authenticated ? "100%" : "62%") : "18%" }} /></div>
      <div className="tool-metrics">
        <span><b>{tool.plugins.length}</b> plugins</span>
        <span><b>{tool.skills.length}</b> skills</span>
        <span className={tool.authenticated ? "positive" : "muted"}>{tool.authenticated ? "Cuenta conectada" : "Falta conectar"}</span>
      </div>
      <div className="tool-actions">
        {tool.installed ? (
          <>
            <button className="launch-button" onClick={() => onAction(tool.id, "launch")}><span>Iniciar</span><b>↗</b></button>
            <button className="secondary-button" onClick={() => onAction(tool.id, "resume")}>Continuar sesión</button>
          </>
        ) : (
          <button className="launch-button" onClick={() => onAction(tool.id, "install")}><span>Instalar</span><b>↓</b></button>
        )}
      </div>
    </article>
  );
}

function LaunchView({ snapshot, settings, onChoose, onAction }: {
  snapshot: LauncherSnapshot | null;
  settings: LauncherSettings;
  onChoose: () => void;
  onAction: (id: ToolId, action: ToolAction) => void;
}) {
  return (
    <>
      <section className="launch-bay">
        <div className="bay-copy">
          <span className="eyebrow">Bahía de lanzamiento</span>
          <h1>Elige el proyecto.<br /><em>Enciende el agente.</em></h1>
          <p>Tres herramientas, una sola puerta de entrada y ninguna credencial compartida.</p>
        </div>
        <button className="project-cartridge" onClick={onChoose}>
          <span className="folder-tab">Proyecto activo</span>
          <strong>{settings.projectPath ? shortPath(settings.projectPath) : "Elegir una carpeta"}</strong>
          <span className="change-path">Cambiar carpeta <b>→</b></span>
        </button>
      </section>
      <div className="connection-rail" aria-hidden="true"><span /><i /><i /><i /></div>
      <section className="tool-grid" aria-label="Agentes disponibles">
        {snapshot?.tools.map((tool) => <ToolCard key={tool.id} tool={tool} onAction={onAction} />) || <LoadingCards />}
      </section>
      <aside className="privacy-note">
        <span className="shield">◇</span>
        <div><strong>Sesiones privadas por diseño</strong><p>El launcher no incluye ni copia tus claves. Cada usuario inicia sesión directamente con el proveedor elegido.</p></div>
      </aside>
    </>
  );
}

function LoadingCards() {
  return <>{[1, 2, 3].map((item) => <div className="tool-card skeleton" key={item}><span /><span /><span /></div>)}</>;
}

function AccountsView({ tools, onAction, onLink }: {
  tools: ToolStatus[];
  onAction: (id: ToolId, action: ToolAction) => void;
  onLink: (url: string) => void;
}) {
  return (
    <section className="content-section">
      <header className="section-heading"><span className="eyebrow">Identidad local</span><h1>Tus cuentas viven fuera del launcher.</h1><p>Cada proveedor conserva su acceso en el perfil actual de Windows. Al compartir el instalador, los demás comienzan desde cero.</p></header>
      <div className="account-list">
        {tools.map((tool) => (
          <article className="account-row" key={tool.id} style={{ "--tool-accent": tool.accent } as React.CSSProperties}>
            <div className="account-name"><span className="account-mark">{tool.id === "codex" ? "CX" : tool.id === "claude" ? "CL" : "OC"}</span><div><h3>{tool.name}</h3><p>{tool.authLabel}</p></div></div>
            <span className={`account-badge ${tool.authenticated ? "connected" : ""}`}><StatusLight ok={tool.authenticated} />{tool.authenticated ? "Conectada" : "Sin conectar"}</span>
            <div className="row-actions">
              {tool.installed ? <button className="small-primary" onClick={() => onAction(tool.id, "login")}>{tool.authenticated ? "Cambiar cuenta" : "Iniciar sesión"}</button> : <button className="small-primary" onClick={() => onAction(tool.id, "install")}>Instalar</button>}
              {tool.authenticated && <button className="text-button" onClick={() => onAction(tool.id, "logout")}>Cerrar sesión</button>}
              <button className="text-button" onClick={() => onLink(tool.accountUrl)}>Gestionar cuenta ↗</button>
            </div>
          </article>
        ))}
      </div>
      <div className="security-callout"><b>Para equipos compartidos</b><p>Usa una cuenta de Windows distinta por persona. Así también quedan separados los historiales, configuraciones y credenciales guardados por cada CLI.</p></div>
    </section>
  );
}

function InventoryView({ tools, onLink }: { tools: ToolStatus[]; onLink: (url: string) => void }) {
  const [active, setActive] = useState<ToolId>("codex");
  const tool = tools.find((item) => item.id === active) || tools[0];
  if (!tool) return <LoadingCards />;
  return (
    <section className="content-section">
      <header className="section-heading compact"><span className="eyebrow">Mesa de diagnóstico</span><h1>Todo lo que cada agente carga.</h1></header>
      <div className="segmented-tabs">{tools.map((item) => <button className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)} key={item.id}>{item.name}<span>{item.plugins.length + item.skills.length}</span></button>)}</div>
      <div className="inventory-grid">
        <article className="ledger">
          <div className="ledger-head"><h2>Plugins</h2><span>{tool.plugins.length} instalados</span></div>
          <div className="ledger-body">{tool.plugins.length ? tool.plugins.map((plugin) => <div className="ledger-row" key={`${plugin.name}-${plugin.source}`}><strong>{plugin.name}</strong><span>{plugin.version || plugin.status || "Activo"}</span><small>{plugin.source || "usuario"}</small></div>) : <div className="empty-state">No se detectaron plugins instalados.</div>}</div>
        </article>
        <article className="ledger">
          <div className="ledger-head"><h2>Skills</h2><span>{tool.skills.length} disponibles</span></div>
          <div className="ledger-body skill-body">{tool.skills.length ? tool.skills.map((skill) => <div className="ledger-row" key={skill.source}><strong>{skill.name}</strong><small title={skill.source}>{skill.source}</small></div>) : <div className="empty-state">No se detectaron skills.</div>}</div>
        </article>
      </div>
      <details className="mcp-drawer"><summary>Servidores MCP detectados <span>Ver salida técnica</span></summary><pre>{tool.mcpSummary || "Sin servidores MCP detectados o herramienta no instalada."}</pre></details>
      <button className="docs-link" onClick={() => onLink(tool.docsUrl)}>Abrir documentación de {tool.name} ↗</button>
    </section>
  );
}

function UpdatesView({ tools, busy, onScan, onAction, onSelfUpdate }: {
  tools: ToolStatus[];
  busy: boolean;
  onScan: () => void;
  onAction: (id: ToolId, action: ToolAction) => void;
  onSelfUpdate: () => void;
}) {
  return (
    <section className="content-section">
      <header className="section-heading"><span className="eyebrow">Mantenimiento</span><h1>Versiones claras, cambios bajo control.</h1><p>La comprobación es automática. Las actualizaciones abren PowerShell para que puedas ver exactamente qué cambia.</p></header>
      <div className="update-toolbar"><button className="small-primary" disabled={busy} onClick={onScan}>{busy ? "Comprobando…" : "Comprobar ahora"}</button><span>No se ejecutan instaladores ocultos.</span></div>
      <div className="update-list">
        {tools.map((tool) => {
          const current = tool.version || "—";
          const latest = tool.latestVersion || "Sin comprobar";
          const upToDate = Boolean(tool.version && tool.latestVersion && tool.version === tool.latestVersion);
          return <article className="update-row" key={tool.id}><div><h3>{tool.name}</h3><p>{tool.installed ? "Instalación detectada" : "Aún no está instalado"}</p></div><div className="version-pair"><span>Actual <b>{current}</b></span><i>→</i><span>Disponible <b>{latest}</b></span></div><button className={upToDate ? "done-button" : "small-primary"} disabled={upToDate} onClick={() => onAction(tool.id, tool.installed ? "update" : "install")}>{upToDate ? "Al día" : tool.installed ? "Actualizar" : "Instalar"}</button></article>;
        })}
        <article className="update-row launcher-update"><div><h3>Jota AI Launcher</h3><p>Canal de actualización del instalador</p></div><div className="version-pair"><span>Actual <b>0.1.0</b></span></div><button className="small-primary" onClick={onSelfUpdate}>Buscar actualización</button></article>
      </div>
    </section>
  );
}

function HelpView({ settings, onSave, onLink }: {
  settings: LauncherSettings;
  onSave: (next: LauncherSettings) => void;
  onLink: (url: string) => void;
}) {
  const toggle = (key: keyof LauncherSettings) => onSave({ ...settings, [key]: !settings[key] });
  return (
    <section className="content-section">
      <header className="section-heading compact"><span className="eyebrow">Guía y ajustes</span><h1>Una puerta, tres maneras de trabajar.</h1></header>
      <div className="help-grid">
        <article className="steps-panel"><h2>Cómo empezar</h2><ol><li><b>Elige un proyecto</b><span>Selecciona la carpeta que contiene tu código.</span></li><li><b>Conecta tu cuenta</b><span>El proveedor abre su propio acceso seguro.</span></li><li><b>Inicia el agente</b><span>PowerShell se abre en la carpeta correcta.</span></li></ol></article>
        <article className="settings-panel"><h2>Preferencias</h2><label className="switch-row"><span><b>Comprobar herramientas</b><small>Busca nuevas versiones al iniciar</small></span><input type="checkbox" checked={settings.autoCheckTools} onChange={() => toggle("autoCheckTools")} /><i /></label><label className="switch-row"><span><b>Actualizar el launcher</b><small>Comprueba el canal de versiones</small></span><input type="checkbox" checked={settings.autoCheckLauncher} onChange={() => toggle("autoCheckLauncher")} /><i /></label><label className="switch-row"><span><b>Iniciar con Windows</b><small>Abre el panel al entrar en tu cuenta</small></span><input type="checkbox" checked={settings.startWithWindows} onChange={() => toggle("startWithWindows")} /><i /></label></article>
      </div>
      <div className="download-strip"><div><strong>¿Falta alguna herramienta?</strong><p>Consulta su instalación y requisitos oficiales.</p></div><button onClick={() => onLink("https://developers.openai.com/codex/cli/")}>Codex ↗</button><button onClick={() => onLink("https://code.claude.com/docs/en/setup")}>Claude Code ↗</button><button onClick={() => onLink("https://opencode.ai/docs/")}>OpenCode ↗</button></div>
    </section>
  );
}

export default function App() {
  const [view, setView] = useState<View>("launch");
  const [settings, setSettings] = useState<LauncherSettings>(EMPTY_SETTINGS);
  const [snapshot, setSnapshot] = useState<LauncherSnapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<string>("");

  const tools = useMemo(() => snapshot?.tools || [], [snapshot]);

  const scan = async (includeLatest = false) => {
    setBusy(true);
    try {
      setSnapshot(await window.launcher.scan(includeLatest));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo completar el diagnóstico.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const saved = await window.launcher.getSettings();
      setSettings(saved);
      await scan(false);
      if (saved.autoCheckTools) {
        void window.launcher.scan(true).then(setSnapshot).catch(() => undefined);
      }
    })();
  }, []);

  const saveSettings = async (next: LauncherSettings) => {
    const saved = await window.launcher.saveSettings(next);
    setSettings(saved);
    setNotice("Preferencias guardadas.");
  };

  const chooseProject = async () => {
    const selected = await window.launcher.selectProject();
    if (selected) await saveSettings({ ...settings, projectPath: selected });
  };

  const runAction = async (tool: ToolId, action: ToolAction) => {
    const result = await window.launcher.runAction(tool, action, settings.projectPath);
    setNotice(result.message);
  };

  const selfUpdate = async () => setNotice((await window.launcher.checkLauncherUpdate()).message);
  const openLink = (url: string) => void window.launcher.openLink(url);

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand"><BrandMark /><div><strong>Jota</strong><span>AI Launcher</span></div></div>
        <nav>{NAV.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.glyph}</span>{item.label}</button>)}</nav>
        <div className="sidebar-foot"><div className="machine-state"><StatusLight ok={Boolean(snapshot)} /><span>{busy ? "Leyendo el sistema…" : `${snapshot?.shell || "PowerShell"} listo`}</span></div><small>v0.1.0 · Windows</small></div>
      </aside>
      <main className="main-panel">
        <header className="topbar"><div className="breadcrumb"><span>Panel local</span><b>/</b><strong>{NAV.find((item) => item.id === view)?.label}</strong></div><button className="refresh-button" onClick={() => void scan(true)} disabled={busy}>{busy ? "Comprobando…" : "↻ Actualizar estado"}</button></header>
        <div className="page-content">
          {view === "launch" && <LaunchView snapshot={snapshot} settings={settings} onChoose={chooseProject} onAction={runAction} />}
          {view === "accounts" && <AccountsView tools={tools} onAction={runAction} onLink={openLink} />}
          {view === "inventory" && <InventoryView tools={tools} onLink={openLink} />}
          {view === "updates" && <UpdatesView tools={tools} busy={busy} onScan={() => void scan(true)} onAction={runAction} onSelfUpdate={selfUpdate} />}
          {view === "help" && <HelpView settings={settings} onSave={saveSettings} onLink={openLink} />}
        </div>
      </main>
      {notice && <button className="toast" onClick={() => setNotice("")}><span>{notice}</span><b>×</b></button>}
    </div>
  );
}
