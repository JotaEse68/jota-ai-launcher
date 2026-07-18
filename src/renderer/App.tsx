import { useEffect, useMemo, useState } from "react";
import type { Language, LauncherSettings, LauncherSnapshot, ProjectInfo, ProjectKind, ToolAction, ToolId, ToolStatus } from "../shared/types";
import { LANGUAGES, translate, type Translator } from "./i18n";

type View = "launch" | "projects" | "accounts" | "inventory" | "updates" | "help";

const APP_VERSION = "0.4.0";
const EMPTY_SETTINGS: LauncherSettings = {
  projectPath: "",
  autoCheckTools: true,
  autoCheckLauncher: true,
  startWithWindows: false,
  language: "es",
  projectRoots: [],
};

const NAV: Array<{ id: View; key: "navLaunch" | "navProjects" | "navAccounts" | "navInventory" | "navUpdates" | "navHelp"; glyph: string }> = [
  { id: "launch", key: "navLaunch", glyph: "▶" },
  { id: "projects", key: "navProjects", glyph: "◆" },
  { id: "accounts", key: "navAccounts", glyph: "◎" },
  { id: "inventory", key: "navInventory", glyph: "▦" },
  { id: "updates", key: "navUpdates", glyph: "↻" },
  { id: "help", key: "navHelp", glyph: "?" },
];

function shortPath(path: string): string {
  if (path.length < 58) return path;
  const separator = path.includes("\\") ? "\\" : "/";
  const parts = path.split(/[\\/]/);
  return `${parts.slice(0, 2).join(separator)}${separator}…${separator}${parts.slice(-2).join(separator)}`;
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

function toolSubtitle(tool: ToolStatus, t: Translator): string {
  return t(tool.id === "codex" ? "codexSubtitle" : tool.id === "claude" ? "claudeSubtitle" : "opencodeSubtitle");
}

function ToolCard({ tool, onAction, t }: { tool: ToolStatus; onAction: (id: ToolId, action: ToolAction) => void; t: Translator }) {
  return (
    <article className="tool-card" style={{ "--tool-accent": tool.accent } as React.CSSProperties}>
      <div className="tool-card-head">
        <div className="tool-monogram">{tool.id === "codex" ? "CX" : tool.id === "claude" ? "CL" : "OC"}</div>
        <div><h3>{tool.name}</h3><p>{toolSubtitle(tool, t)}</p></div>
        <span className={`tool-state ${tool.installed ? "ready" : "missing"}`}>
          <StatusLight ok={tool.installed} /> {tool.installed ? tool.version || t("ready") : t("notInstalled")}
        </span>
      </div>
      <div className="signal-track"><span style={{ width: tool.installed ? (tool.authenticated ? "100%" : "62%") : "18%" }} /></div>
      <div className="tool-metrics">
        <span><b>{tool.plugins.length}</b> {t("plugins")}</span>
        <span><b>{tool.skills.length}</b> {t("skills")}</span>
        <span className={tool.authenticated ? "positive" : "muted"}>{tool.authenticated ? t("connectedAccount") : t("connectMissing")}</span>
      </div>
      <div className="tool-actions">
        {tool.installed ? <><button className="launch-button" onClick={() => onAction(tool.id, "launch")}><span>{t("start")}</span><b>↗</b></button><button className="secondary-button" onClick={() => onAction(tool.id, "resume")}>{t("resume")}</button></> : <button className="launch-button" onClick={() => onAction(tool.id, "install")}><span>{t("install")}</span><b>↓</b></button>}
      </div>
    </article>
  );
}

function LoadingCards() {
  return <>{[1, 2, 3].map((item) => <div className="tool-card skeleton" key={item}><span /><span /><span /></div>)}</>;
}

function LaunchView({ snapshot, settings, onChoose, onAction, t }: { snapshot: LauncherSnapshot | null; settings: LauncherSettings; onChoose: () => void; onAction: (id: ToolId, action: ToolAction) => void; t: Translator }) {
  return <>
    <section className="launch-bay">
      <div className="bay-copy"><span className="eyebrow">{t("launchEyebrow")}</span><h1>{t("launchTitle1")}<br /><em>{t("launchTitle2")}</em></h1><p>{t("launchIntro")}</p></div>
      <button className="project-cartridge" onClick={onChoose}><span className="folder-tab">{t("activeProject")}</span><strong>{settings.projectPath ? shortPath(settings.projectPath) : t("chooseFolder")}</strong><span className="change-path">{t("changeFolder")} <b>→</b></span></button>
    </section>
    <div className="connection-rail" aria-hidden="true"><span /><i /><i /><i /></div>
    <section className="tool-grid" aria-label={t("availableAgents")}>{snapshot?.tools.map((tool) => <ToolCard key={tool.id} tool={tool} onAction={onAction} t={t} />) || <LoadingCards />}</section>
    <aside className="privacy-note"><span className="shield">◇</span><div><strong>{t("privateTitle")}</strong><p>{t("privateText")}</p></div></aside>
  </>;
}

const PROJECT_KINDS: Record<ProjectKind, { glyph: string; label: string }> = {
  javascript: { glyph: "JS", label: "JavaScript" }, python: { glyph: "PY", label: "Python" }, rust: { glyph: "RS", label: "Rust" },
  go: { glyph: "GO", label: "Go" }, dotnet: { glyph: ".N", label: ".NET" }, php: { glyph: "PHP", label: "PHP" }, ruby: { glyph: "RB", label: "Ruby" }, git: { glyph: "GIT", label: "Git" }, folder: { glyph: "DIR", label: "Folder" },
};

function ProjectsView({ projects, customRoots, automaticRoots, busy, onAddRoot, onRemoveRoot, onScan, onSelect, onOpen, onLink, t }: {
  projects: ProjectInfo[]; customRoots: string[]; automaticRoots: string[]; busy: boolean; onAddRoot: () => void; onRemoveRoot: (root: string) => void;
  onScan: () => void; onSelect: (project: ProjectInfo) => void; onOpen: (project: ProjectInfo) => void; onLink: (url: string) => void; t: Translator;
}) {
  return <section className="content-section projects-section">
    <header className="projects-heading"><div className="section-heading compact"><span className="eyebrow">{t("projectsEyebrow")}</span><h1>{t("projectsTitle")}</h1><p>{t("projectsIntro")}</p></div><div className="project-toolbar"><button className="small-primary" onClick={onAddRoot}>＋ {t("addProjectFolder")}</button><button className="refresh-button" onClick={onScan} disabled={busy}>{busy ? t("scanningProjects") : `↻ ${t("scanProjects")}`}</button></div></header>
    <div className="project-summary"><strong>{t("detectedProjects", { count: projects.length })}</strong><details><summary>{t("searchLocations")}</summary><div className="root-list"><span className="automatic-root">{t("automaticLocations")} · {automaticRoots.length}</span>{customRoots.map((root) => <span className="root-chip" key={root} title={root}>{shortPath(root)}<button aria-label={`${t("removeRoot")} ${root}`} onClick={() => onRemoveRoot(root)}>×</button></span>)}</div></details></div>
    {busy && !projects.length ? <div className="project-grid"><LoadingCards /></div> : projects.length ? <div className="project-grid">{projects.map((project) => {
      const kind = PROJECT_KINDS[project.kind];
      const visibleTechnologies = project.technologies.slice(0, 5);
      const remainingTechnologies = project.technologies.length - visibleTechnologies.length;
      return <article className={`project-card kind-${project.kind}`} key={project.path}>
        <button className="project-card-main" onClick={() => onSelect(project)}>
          <span className="project-visual"><i>{kind.glyph}</i><span className="project-service-list">{project.services.map((service) => <b key={service}>{service}</b>)}{!project.services.length && <b>{t("localFolder")}</b>}</span></span>
          <span className="project-copy">
            <small>{project.source === "folder" ? t("localFolder") : kind.label} · {project.marker}</small>
            <strong>{project.name}</strong>
            <span className="project-description">{project.description || t("noProjectDescription")}</span>
            {!!visibleTechnologies.length && <span className="project-tags">{visibleTechnologies.map((technology) => <i key={technology}>{technology}</i>)}{remainingTechnologies > 0 && <i>+{remainingTechnologies}</i>}</span>}
            <span className="project-path" title={project.path}>{shortPath(project.path)}</span>
          </span>
          <span className="project-use">{t("useProject")} <b>→</b></span>
        </button>
        <span className="project-card-actions">{project.repositoryUrl && <button className="project-repository" onClick={() => onLink(project.repositoryUrl!)}>GitHub ↗</button>}<button className="project-open" onClick={() => onOpen(project)}>{t("openFolder")} ↗</button></span>
      </article>;
    })}</div> : <div className="projects-empty"><span>◇</span><div><h2>{t("noProjectsTitle")}</h2><p>{t("noProjectsText")}</p></div><button className="small-primary" onClick={onAddRoot}>{t("addProjectFolder")}</button></div>}
  </section>;
}

function AccountsView({ tools, onAction, onLink, t }: { tools: ToolStatus[]; onAction: (id: ToolId, action: ToolAction) => void; onLink: (url: string) => void; t: Translator }) {
  return <section className="content-section">
    <header className="section-heading"><span className="eyebrow">{t("accountsEyebrow")}</span><h1>{t("accountsTitle")}</h1><p>{t("accountsIntro")}</p></header>
    <div className="account-list">{tools.map((tool) => <article className="account-row" key={tool.id} style={{ "--tool-accent": tool.accent } as React.CSSProperties}>
      <div className="account-name"><span className="account-mark">{tool.id === "codex" ? "CX" : tool.id === "claude" ? "CL" : "OC"}</span><div><h3>{tool.name}</h3><p>{tool.authenticated ? t("connectedAccount") : t("disconnected")}</p></div></div>
      <span className={`account-badge ${tool.authenticated ? "connected" : ""}`}><StatusLight ok={tool.authenticated} />{tool.authenticated ? t("connected") : t("disconnected")}</span>
      <div className="row-actions">{tool.installed ? <button className="small-primary" onClick={() => onAction(tool.id, "login")}>{tool.authenticated ? t("changeAccount") : t("signIn")}</button> : <button className="small-primary" onClick={() => onAction(tool.id, "install")}>{t("install")}</button>}{tool.authenticated && <button className="text-button" onClick={() => onAction(tool.id, "logout")}>{t("signOut")}</button>}<button className="text-button" onClick={() => onLink(tool.accountUrl)}>{t("manageAccount")} ↗</button></div>
    </article>)}</div>
    <div className="security-callout"><b>{t("sharedComputer")}</b><p>{t("sharedComputerText")}</p></div>
  </section>;
}

function InventoryView({ tools, onLink, t }: { tools: ToolStatus[]; onLink: (url: string) => void; t: Translator }) {
  const [active, setActive] = useState<ToolId>("codex");
  const tool = tools.find((item) => item.id === active) || tools[0];
  if (!tool) return <LoadingCards />;
  return <section className="content-section">
    <header className="section-heading compact"><span className="eyebrow">{t("inventoryEyebrow")}</span><h1>{t("inventoryTitle")}</h1></header>
    <div className="segmented-tabs">{tools.map((item) => <button className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)} key={item.id}>{item.name}<span>{item.plugins.length + item.skills.length}</span></button>)}</div>
    <div className="inventory-grid">
      <article className="ledger"><div className="ledger-head"><h2>Plugins</h2><span>{t("installedCount", { count: tool.plugins.length })}</span></div><div className="ledger-body">{tool.plugins.length ? tool.plugins.map((plugin) => <div className="ledger-row" key={`${plugin.name}-${plugin.source}`}><strong>{plugin.name}</strong><span>{plugin.version || plugin.status || t("active")}</span><small>{plugin.source || t("user")}</small></div>) : <div className="empty-state">{t("noPlugins")}</div>}</div></article>
      <article className="ledger"><div className="ledger-head"><h2>Skills</h2><span>{t("availableCount", { count: tool.skills.length })}</span></div><div className="ledger-body skill-body">{tool.skills.length ? tool.skills.map((skill) => <div className="ledger-row" key={skill.source}><strong>{skill.name}</strong><small title={skill.source}>{skill.source}</small></div>) : <div className="empty-state">{t("noSkills")}</div>}</div></article>
    </div>
    <details className="mcp-drawer"><summary>{t("mcpDetected")} <span>{t("technicalOutput")}</span></summary><pre>{tool.mcpSummary || t("noMcp")}</pre></details>
    <button className="docs-link" onClick={() => onLink(tool.docsUrl)}>{t("openDocs", { tool: tool.name })} ↗</button>
  </section>;
}

function UpdatesView({ tools, busy, onScan, onAction, onSelfUpdate, t }: { tools: ToolStatus[]; busy: boolean; onScan: () => void; onAction: (id: ToolId, action: ToolAction) => void; onSelfUpdate: () => void; t: Translator }) {
  return <section className="content-section">
    <header className="section-heading"><span className="eyebrow">{t("maintenance")}</span><h1>{t("updatesTitle")}</h1><p>{t("updatesIntro")}</p></header>
    <div className="update-toolbar"><button className="small-primary" disabled={busy} onClick={onScan}>{busy ? t("checking") : t("checkNow")}</button><span>{t("noHiddenInstallers")}</span></div>
    <div className="update-list">{tools.map((tool) => {
      const current = tool.version || "—";
      const latest = tool.latestVersion || t("notChecked");
      const upToDate = Boolean(tool.version && tool.latestVersion && tool.version === tool.latestVersion);
      return <article className="update-row" key={tool.id}><div><h3>{tool.name}</h3><p>{tool.installed ? t("detectedInstall") : t("notYetInstalled")}</p></div><div className="version-pair"><span>{t("current")} <b>{current}</b></span><i>→</i><span>{t("available")} <b>{latest}</b></span></div><button className={upToDate ? "done-button" : "small-primary"} disabled={upToDate} onClick={() => onAction(tool.id, tool.installed ? "update" : "install")}>{upToDate ? t("upToDate") : tool.installed ? t("update") : t("install")}</button></article>;
    })}<article className="update-row launcher-update"><div><h3>Jota AI Launcher</h3><p>{t("launcherChannel")}</p></div><div className="version-pair"><span>{t("current")} <b>{APP_VERSION}</b></span></div><button className="small-primary" onClick={onSelfUpdate}>{t("searchUpdate")}</button></article></div>
  </section>;
}

function HelpView({ settings, onSave, onLink, t }: { settings: LauncherSettings; onSave: (next: LauncherSettings) => void; onLink: (url: string) => void; t: Translator }) {
  const toggle = (key: "autoCheckTools" | "autoCheckLauncher" | "startWithWindows") => onSave({ ...settings, [key]: !settings[key] });
  return <section className="content-section">
    <header className="section-heading compact"><span className="eyebrow">{t("guideEyebrow")}</span><h1>{t("guideTitle")}</h1></header>
    <div className="help-grid">
      <article className="steps-panel"><h2>{t("howToStart")}</h2><ol><li><b>{t("stepProject")}</b><span>{t("stepProjectText")}</span></li><li><b>{t("stepAccount")}</b><span>{t("stepAccountText")}</span></li><li><b>{t("stepAgent")}</b><span>{t("stepAgentText")}</span></li></ol></article>
      <article className="settings-panel"><h2>{t("preferences")}</h2><label className="switch-row"><span><b>{t("checkTools")}</b><small>{t("checkToolsText")}</small></span><input type="checkbox" checked={settings.autoCheckTools} onChange={() => toggle("autoCheckTools")} /><i /></label><label className="switch-row"><span><b>{t("updateLauncher")}</b><small>{t("updateLauncherText")}</small></span><input type="checkbox" checked={settings.autoCheckLauncher} onChange={() => toggle("autoCheckLauncher")} /><i /></label><label className="switch-row"><span><b>{t("startSystem")}</b><small>{t("startSystemText")}</small></span><input type="checkbox" checked={settings.startWithWindows} onChange={() => toggle("startWithWindows")} /><i /></label></article>
    </div>
    <div className="download-strip"><div><strong>{t("missingTool")}</strong><p>{t("officialRequirements")}</p></div><button onClick={() => onLink("https://developers.openai.com/codex/cli/")}>Codex ↗</button><button onClick={() => onLink("https://code.claude.com/docs/en/setup")}>Claude Code ↗</button><button onClick={() => onLink("https://opencode.ai/docs/")}>OpenCode ↗</button></div>
  </section>;
}

export default function App() {
  const [view, setView] = useState<View>("launch");
  const [settings, setSettings] = useState<LauncherSettings>(EMPTY_SETTINGS);
  const [snapshot, setSnapshot] = useState<LauncherSnapshot | null>(null);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [automaticRoots, setAutomaticRoots] = useState<string[]>([]);
  const [projectsBusy, setProjectsBusy] = useState(true);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const language = settings.language || "es";
  const t: Translator = (key, values) => translate(language, key, values);
  const tools = useMemo(() => snapshot?.tools || [], [snapshot]);

  const scan = async (includeLatest = false) => {
    setBusy(true);
    try { setSnapshot(await window.launcher.scan(includeLatest)); }
    catch (error) { setNotice(error instanceof Error ? error.message : t("diagnosticError")); }
    finally { setBusy(false); }
  };

  const refreshProjects = async () => {
    setProjectsBusy(true);
    try {
      const result = await window.launcher.scanProjects();
      setProjects(result.projects);
      setAutomaticRoots(result.automaticRoots);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("diagnosticError"));
    } finally {
      setProjectsBusy(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const saved = await window.launcher.getSettings();
      setSettings(saved);
      document.documentElement.lang = saved.language;
      await Promise.all([scan(false), refreshProjects()]);
      if (saved.autoCheckTools) void window.launcher.scan(true).then(setSnapshot).catch(() => undefined);
    })();
  }, []);

  const saveSettings = async (next: LauncherSettings, message?: string) => {
    const saved = await window.launcher.saveSettings(next);
    setSettings(saved);
    document.documentElement.lang = saved.language;
    setNotice(message || translate(saved.language, "settingsSaved"));
    return saved;
  };

  const chooseProject = async () => {
    const selected = await window.launcher.selectProject(language);
    if (selected) await saveSettings({ ...settings, projectPath: selected });
  };
  const addProjectRoot = async () => {
    const root = await window.launcher.selectProjectRoot(language);
    if (!root) return;
    const nextRoots = [...new Map([...(settings.projectRoots || []), root].map((item) => [item.toLowerCase(), item])).values()];
    await saveSettings({ ...settings, projectRoots: nextRoots });
    await refreshProjects();
  };
  const removeProjectRoot = async (root: string) => {
    await saveSettings({ ...settings, projectRoots: settings.projectRoots.filter((item) => item !== root) });
    await refreshProjects();
  };
  const selectLibraryProject = async (project: ProjectInfo) => {
    await saveSettings({ ...settings, projectPath: project.path }, t("projectSelected", { name: project.name }));
    setView("launch");
  };
  const openProjectFolder = async (project: ProjectInfo) => {
    const result = await window.launcher.openFolder(project.path);
    setNotice(result.ok ? t("projectFolderOpened") : result.message || t("folderOpenError"));
  };
  const runAction = async (tool: ToolId, action: ToolAction) => setNotice((await window.launcher.runAction(tool, action, language)).message);
  const selfUpdate = async () => setNotice((await window.launcher.checkLauncherUpdate(language)).message);
  const openLink = (url: string) => void window.launcher.openLink(url);
  const platformName = snapshot?.platform === "macos" ? "macOS" : snapshot?.platform === "windows" ? "Windows" : "Desktop";
  const activeNav = NAV.find((item) => item.id === view);

  return <div className="app-frame">
    <aside className="sidebar">
      <div className="brand"><BrandMark /><div><strong>Jota</strong><span>AI Launcher</span></div></div>
      <nav>{NAV.map((item) => <button key={item.id} data-view={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.glyph}</span>{t(item.key)}</button>)}</nav>
      <div className="sidebar-foot">
        <div className="machine-state"><StatusLight ok={Boolean(snapshot)} /><span>{busy ? t("readingSystem") : t("shellReady", { shell: snapshot?.shell || "Terminal" })}</span></div>
        <small>v{APP_VERSION} · {platformName}</small>
        <div className="author-links" aria-label="Jota Santos">
          <button onClick={() => openLink("https://jsantos.pro/")}>by Jota!</button>
          <button onClick={() => openLink("https://iapacks.com/")}>iapacks.com · Premium WordPress Plugins &amp; Tools · Built by Jota Santos</button>
          <button onClick={() => openLink("https://github.com/JotaEse68")}>GitHub · @JotaEse68</button>
        </div>
      </div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><div className="breadcrumb"><span>{t("localPanel")}</span><b>/</b><strong>{activeNav ? t(activeNav.key) : ""}</strong></div><div className="topbar-actions"><label className="language-picker"><span>{t("language")}</span><select aria-label={t("language")} value={language} onChange={(event) => { const nextLanguage = event.target.value as Language; void saveSettings({ ...settings, language: nextLanguage }, translate(nextLanguage, "settingsSaved")); }}>{LANGUAGES.map((item) => <option value={item.code} key={item.code}>{item.label}</option>)}</select></label><button className="refresh-button" onClick={() => void scan(true)} disabled={busy}>{busy ? t("checking") : `↻ ${t("refreshStatus")}`}</button></div></header>
      <div className="page-content">
        {view === "launch" && <LaunchView snapshot={snapshot} settings={settings} onChoose={chooseProject} onAction={runAction} t={t} />}
        {view === "projects" && <ProjectsView projects={projects} customRoots={settings.projectRoots || []} automaticRoots={automaticRoots} busy={projectsBusy} onAddRoot={addProjectRoot} onRemoveRoot={removeProjectRoot} onScan={() => void refreshProjects()} onSelect={selectLibraryProject} onOpen={openProjectFolder} onLink={openLink} t={t} />}
        {view === "accounts" && <AccountsView tools={tools} onAction={runAction} onLink={openLink} t={t} />}
        {view === "inventory" && <InventoryView tools={tools} onLink={openLink} t={t} />}
        {view === "updates" && <UpdatesView tools={tools} busy={busy} onScan={() => void scan(true)} onAction={runAction} onSelfUpdate={selfUpdate} t={t} />}
        {view === "help" && <HelpView settings={settings} onSave={saveSettings} onLink={openLink} t={t} />}
      </div>
    </main>
    {notice && <button className="toast" onClick={() => setNotice("")}><span>{notice}</span><b>×</b></button>}
  </div>;
}
