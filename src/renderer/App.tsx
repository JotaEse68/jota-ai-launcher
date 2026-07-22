import { useEffect, useMemo, useState } from "react";
import { isProjectHidden } from "../shared/types";
import type { CleanupReport, Language, LauncherSettings, LauncherSnapshot, ProjectInfo, ProjectKind, ProjectPhase, ProjectPlan, ProjectType, ToolAction, ToolId, ToolStatus } from "../shared/types";
import { LANGUAGES, translate, type Translator } from "./i18n";

type View = "launch" | "projects" | "cleanup" | "accounts" | "inventory" | "updates" | "help";

const APP_VERSION = "0.6.0";
const EMPTY_SETTINGS: LauncherSettings = {
  projectPath: "",
  autoCheckTools: true,
  autoCheckLauncher: true,
  startWithWindows: false,
  language: "es",
  projectRoots: [],
  projectPlans: {},
  projectLinks: {},
  hiddenProjects: [],
};

const NAV: Array<{ id: View; key: "navLaunch" | "navProjects" | "navCleanup" | "navAccounts" | "navInventory" | "navUpdates" | "navHelp"; glyph: string }> = [
  { id: "launch", key: "navLaunch", glyph: "▶" },
  { id: "projects", key: "navProjects", glyph: "◆" },
  { id: "cleanup", key: "navCleanup", glyph: "⌁" },
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

const PROJECT_TYPES: Record<ProjectType, string> = {
  "web-app": "App web", "desktop-app": "App de escritorio", plugin: "Plugin", theme: "Tema", library: "Librería", service: "Servicio", website: "Sitio web", folder: "Carpeta",
};

function siteHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1_024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1_024; index += 1) { value /= 1_024; unit = units[index]; }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

type ProjectFilter = "all" | "focus" | "risk" | "unplanned" | "closed";

const PHASES: ProjectPhase[] = ["backlog", "building", "testing", "shipping", "done", "paused", "abandoned"];

function emptyProjectPlan(): ProjectPlan {
  return {
    phase: "backlog", deadline: "", nextAction: "", definitionOfDone: "", focus: false, updatedAt: new Date().toISOString(),
    lastSessionSummary: "", blocker: "", lastSessionAt: "", abandonedReason: "", lessonLearned: "",
  };
}

function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = old;
    }
  }
  return previous[b.length];
}

function fuzzyTokenScore(token: string, text: string): number {
  if (!token) return 0;
  if (text === token) return 100;
  if (text.startsWith(token)) return 85;
  if (text.includes(token)) return 72;
  const words = text.split(" ").filter(Boolean);
  let best = 0;
  for (const word of words) {
    const distance = editDistance(token, word);
    const tolerance = token.length >= 8 ? 3 : token.length >= 5 ? 2 : 1;
    if (distance <= tolerance) best = Math.max(best, 62 - distance * 9);
    let cursor = 0;
    for (const character of word) if (character === token[cursor]) cursor += 1;
    if (cursor === token.length) best = Math.max(best, 42 - Math.max(0, word.length - token.length));
  }
  return best;
}

function projectSearchScore(project: ProjectInfo, query: string): number {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return 1;
  const name = normalizeSearch(project.name);
  const description = normalizeSearch(project.description || "");
  const metadata = normalizeSearch([project.path, project.kind, ...project.technologies, ...project.services].join(" "));
  let total = 0;
  for (const token of normalizedQuery.split(" ")) {
    const score = Math.max(fuzzyTokenScore(token, name) + 18, fuzzyTokenScore(token, description), fuzzyTokenScore(token, metadata) - 8);
    if (score <= 0) return 0;
    total += score;
  }
  return total;
}

function isPlanAtRisk(plan?: ProjectPlan): boolean {
  if (!plan || plan.phase === "done" || plan.phase === "paused" || plan.phase === "abandoned") return false;
  if (plan.deadline && plan.deadline < new Date().toISOString().slice(0, 10)) return true;
  return Boolean(plan.focus && (!plan.nextAction || plan.blocker));
}

function deadlineLabel(deadline: string, language: Language, t: Translator): string {
  if (!deadline) return t("noDeadline");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${deadline}T00:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return t("deadlineOverdue", { count: Math.abs(days) });
  if (days === 0) return t("deadlineToday");
  if (days <= 14) return t("deadlineDays", { count: days });
  return new Intl.DateTimeFormat(language, { day: "numeric", month: "short" }).format(target);
}

function ProjectPlanEditor({ project, initialPlan, focusCount, language, onCancel, onSave, t }: {
  project: ProjectInfo; initialPlan?: ProjectPlan; focusCount: number; language: Language; onCancel: () => void; onSave: (plan: ProjectPlan) => void; t: Translator;
}) {
  const [plan, setPlan] = useState<ProjectPlan>(initialPlan || emptyProjectPlan());
  const focusUnavailable = !plan.focus && !initialPlan?.focus && focusCount >= 3;
  return <div className="plan-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <form className="plan-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-title" onSubmit={(event) => { event.preventDefault(); onSave({ ...plan, updatedAt: new Date().toISOString(), focus: plan.phase === "done" || plan.phase === "paused" || plan.phase === "abandoned" ? false : plan.focus }); }}>
      <header><div><span className="eyebrow">{t("finishPlan")}</span><h2 id="plan-title">{project.name}</h2></div><button type="button" className="dialog-close" onClick={onCancel} aria-label={t("cancel")}>×</button></header>
      <p className="plan-intro">{t("finishPlanIntro")}</p>
      <div className="plan-form-grid">
        <label><span>{t("phase")}</span><select value={plan.phase} onChange={(event) => setPlan({ ...plan, phase: event.target.value as ProjectPhase })}>{PHASES.map((phase) => <option key={phase} value={phase}>{t(`phase${phase[0].toUpperCase()}${phase.slice(1)}` as Parameters<Translator>[0])}</option>)}</select></label>
        <label><span>{t("deadline")}</span><input type="date" lang={language} value={plan.deadline} onChange={(event) => setPlan({ ...plan, deadline: event.target.value })} /></label>
      </div>
      <label className="plan-wide"><span>{t("nextAction")}</span><input autoFocus maxLength={240} value={plan.nextAction} onChange={(event) => setPlan({ ...plan, nextAction: event.target.value })} placeholder={t("nextActionPlaceholder")} /></label>
      <label className="plan-wide"><span>{t("definitionDone")}</span><textarea maxLength={500} value={plan.definitionOfDone} onChange={(event) => setPlan({ ...plan, definitionOfDone: event.target.value })} placeholder={t("definitionDonePlaceholder")} /></label>
      <label className={`focus-check ${focusUnavailable ? "disabled" : ""}`}><input type="checkbox" checked={plan.focus} disabled={focusUnavailable || plan.phase === "done" || plan.phase === "paused" || plan.phase === "abandoned"} onChange={(event) => setPlan({ ...plan, focus: event.target.checked })} /><span><b>{t("putInFocus")}</b><small>{focusUnavailable ? t("focusLimit") : t("focusExplanation")}</small></span></label>
      <footer><button type="button" className="text-button" onClick={onCancel}>{t("cancel")}</button><button type="submit" className="small-primary">{t("savePlan")}</button></footer>
    </form>
  </div>;
}

function SessionCloseEditor({ project, initialPlan, onCancel, onSave, t }: {
  project: ProjectInfo; initialPlan?: ProjectPlan; onCancel: () => void; onSave: (plan: ProjectPlan, abandoned: boolean) => void; t: Translator;
}) {
  const [mode, setMode] = useState<"checkpoint" | "abandon">(initialPlan?.phase === "abandoned" ? "abandon" : "checkpoint");
  const [plan, setPlan] = useState<ProjectPlan>(initialPlan || emptyProjectPlan());
  const saveCheckpoint = () => {
    const now = new Date().toISOString();
    onSave({ ...plan, phase: plan.phase === "backlog" || plan.phase === "abandoned" ? "building" : plan.phase, updatedAt: now, lastSessionAt: now, abandonedReason: "", lessonLearned: "" }, false);
  };
  const saveAbandonment = () => {
    const now = new Date().toISOString();
    onSave({ ...plan, phase: "abandoned", focus: false, deadline: "", nextAction: "", blocker: "", updatedAt: now }, true);
  };
  return <div className="plan-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <form className={`plan-dialog reflection-dialog mode-${mode}`} role="dialog" aria-modal="true" aria-labelledby="reflection-title" onSubmit={(event) => { event.preventDefault(); if (mode === "checkpoint") saveCheckpoint(); else saveAbandonment(); }}>
      <header><div><span className="eyebrow">{t("sessionRitual")}</span><h2 id="reflection-title">{project.name}</h2></div><button type="button" className="dialog-close" onClick={onCancel} aria-label={t("cancel")}>×</button></header>
      <div className="reflection-tabs" role="tablist"><button type="button" role="tab" aria-selected={mode === "checkpoint"} className={mode === "checkpoint" ? "active" : ""} onClick={() => setMode("checkpoint")}>{t("closeSession")}</button><button type="button" role="tab" aria-selected={mode === "abandon"} className={mode === "abandon" ? "active" : ""} onClick={() => setMode("abandon")}>{t("letGoProject")}</button></div>
      {mode === "checkpoint" ? <div className="reflection-fields">
        <p className="plan-intro">{t("closeSessionIntro")}</p>
        <label className="plan-wide"><span>{t("whatMoved")}</span><textarea autoFocus required maxLength={500} value={plan.lastSessionSummary} onChange={(event) => setPlan({ ...plan, lastSessionSummary: event.target.value })} placeholder={t("whatMovedPlaceholder")} /></label>
        <label className="plan-wide"><span>{t("currentBlocker")}</span><input maxLength={240} value={plan.blocker} onChange={(event) => setPlan({ ...plan, blocker: event.target.value })} placeholder={t("currentBlockerPlaceholder")} /></label>
        <label className="plan-wide"><span>{t("landingStrip")}</span><input required maxLength={240} value={plan.nextAction} onChange={(event) => setPlan({ ...plan, nextAction: event.target.value })} placeholder={t("landingStripPlaceholder")} /></label>
      </div> : <div className="reflection-fields abandon-fields">
        <p className="plan-intro">{t("letGoIntro")}</p>
        <label className="plan-wide"><span>{t("whyStop")}</span><textarea autoFocus required maxLength={500} value={plan.abandonedReason} onChange={(event) => setPlan({ ...plan, abandonedReason: event.target.value })} placeholder={t("whyStopPlaceholder")} /></label>
        <label className="plan-wide"><span>{t("whatLearned")}</span><textarea maxLength={500} value={plan.lessonLearned} onChange={(event) => setPlan({ ...plan, lessonLearned: event.target.value })} placeholder={t("whatLearnedPlaceholder")} /></label>
      </div>}
      <footer><button type="button" className="text-button" onClick={onCancel}>{t("cancel")}</button><button type="submit" className={mode === "abandon" ? "release-button" : "small-primary"}>{mode === "checkpoint" ? t("saveCheckpoint") : t("confirmLetGo")}</button></footer>
    </form>
  </div>;
}

function ProjectLinkEditor({ project, initialUrl, onCancel, onSave, t }: { project: ProjectInfo; initialUrl: string; onCancel: () => void; onSave: (url: string) => void; t: Translator }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = url.trim();
    if (value) {
      try { if (new URL(value).protocol !== "https:") throw new Error(); }
      catch { setError(t("publicLinkInvalid")); return; }
    }
    onSave(value);
  };
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <form className="plan-dialog link-dialog" onSubmit={submit} aria-modal="true" role="dialog">
      <header><div><span className="eyebrow">{t("publicLinkEyebrow")}</span><h2>{project.name}</h2></div><button type="button" onClick={onCancel} aria-label={t("cancel")}>×</button></header>
      <p className="plan-intro">{t("publicLinkHelp")}</p>
      <label className="link-field"><span>{t("publicLinkLabel")}</span><input autoFocus value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="https://mi-proyecto.vercel.app" />{error && <small>{error}</small>}</label>
      <div className="deployment-hints"><span>Vercel</span><span>Netlify</span><span>Render</span><span>Cloudflare</span><span>{t("customDomain")}</span></div>
      <footer><button type="button" className="text-button" onClick={onCancel}>{t("cancel")}</button>{initialUrl && <button type="button" className="text-button danger-text" onClick={() => onSave("")}>{t("removeLink")}</button>}<button type="submit" className="small-primary">{t("saveLink")}</button></footer>
    </form>
  </div>;
}

function ProjectsView({ projects, plans, projectLinks, hiddenCount, customRoots, automaticRoots, busy, language, onAddRoot, onAddRootPath, onRemoveRoot, onRestoreHidden, onScan, onSelect, onOpen, onLink, onSetLink, onHide, onSavePlan, t }: {
  projects: ProjectInfo[]; plans: Record<string, ProjectPlan>; projectLinks: Record<string, string>; hiddenCount: number; customRoots: string[]; automaticRoots: string[]; busy: boolean; language: Language; onAddRoot: () => void; onAddRootPath: (path: string) => Promise<boolean>; onRemoveRoot: (root: string) => void; onRestoreHidden: () => void;
  onScan: () => void; onSelect: (project: ProjectInfo) => void; onOpen: (project: ProjectInfo) => void; onLink: (url: string) => void; onSetLink: (project: ProjectInfo, url: string) => void; onHide: (project: ProjectInfo) => void; onSavePlan: (project: ProjectInfo, plan: ProjectPlan, result?: "plan" | "checkpoint" | "abandoned") => void; t: Translator;
}) {
  const [query, setQuery] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [listening, setListening] = useState(false);
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [editing, setEditing] = useState<ProjectInfo | null>(null);
  const [reflecting, setReflecting] = useState<ProjectInfo | null>(null);
  const [linking, setLinking] = useState<ProjectInfo | null>(null);
  const [hiding, setHiding] = useState<ProjectInfo | null>(null);
  const addTypedRoot = async () => { if (await onAddRootPath(rootPath)) setRootPath(""); };
  const dictateRoot = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => setRootPath(event.results[0]?.[0]?.transcript || "");
    recognition.start();
  };
  const focusProjects = projects.filter((project) => plans[project.path]?.focus && !["done", "paused", "abandoned"].includes(plans[project.path]?.phase)).sort((a, b) => (plans[a.path].deadline || "9999").localeCompare(plans[b.path].deadline || "9999"));
  const leadProject = focusProjects[0];
  const rankedProjects = projects.map((project) => ({ project, score: projectSearchScore(project, query) })).filter(({ project, score }) => score > 0 && (filter === "all" || (filter === "focus" && plans[project.path]?.focus) || (filter === "risk" && isPlanAtRisk(plans[project.path])) || (filter === "unplanned" && !plans[project.path]) || (filter === "closed" && ["done", "abandoned"].includes(plans[project.path]?.phase)))).sort((a, b) => b.score - a.score || Number(Boolean(plans[b.project.path]?.focus)) - Number(Boolean(plans[a.project.path]?.focus)) || Number(!["done", "abandoned"].includes(plans[b.project.path]?.phase)) - Number(!["done", "abandoned"].includes(plans[a.project.path]?.phase)) || b.project.updatedAt.localeCompare(a.project.updatedAt));

  return <section className="content-section projects-section">
    <header className="projects-heading"><div className="section-heading compact"><span className="eyebrow">{t("projectsEyebrow")}</span><h1>{t("projectsTitle")}</h1><p>{t("projectsIntro")}</p></div><div className="project-toolbar"><button className="small-primary" onClick={onAddRoot}>＋ {t("addProjectFolder")}</button><button className="refresh-button" onClick={onScan} disabled={busy}>{busy ? t("scanningProjects") : `↻ ${t("scanProjects")}`}</button></div></header>
    <form className="location-command" onSubmit={(event) => { event.preventDefault(); void addTypedRoot(); }}><span className="command-prompt">›_</span><label><span>{t("folderCommandLabel")}</span><input value={rootPath} onChange={(event) => setRootPath(event.target.value)} placeholder={t("folderCommandPlaceholder")} /></label><button type="button" className={`voice-button ${listening ? "listening" : ""}`} onClick={dictateRoot} disabled={!window.SpeechRecognition && !window.webkitSpeechRecognition} title={t("dictateFolder")}>●</button><button type="submit" className="small-primary" disabled={!rootPath.trim()}>{t("searchHere")}</button></form>
    <aside className={`finish-desk ${leadProject ? "has-project" : ""}`}>
      <div className="finish-marker"><span>{focusProjects.length}</span><small>/ 3</small></div>
      {leadProject ? <><div className="finish-copy"><small>{t("finishNow")}</small><strong>{leadProject.name}</strong><p>{plans[leadProject.path].blocker ? `${t("blockedBy")}: ${plans[leadProject.path].blocker}` : plans[leadProject.path].nextAction || t("missingNextAction")}</p></div><div className="finish-meta"><span className={isPlanAtRisk(plans[leadProject.path]) ? "is-risk" : ""}>{deadlineLabel(plans[leadProject.path].deadline, language, t)}</span><div className="finish-actions"><button onClick={() => setReflecting(leadProject)}>{t("closeSession")}</button><button onClick={() => onSelect(leadProject)}>{t("continueProject")} →</button></div></div></> : <><div className="finish-copy"><small>{t("focusDesk")}</small><strong>{t("focusDeskEmpty")}</strong><p>{t("focusDeskEmptyText")}</p></div>{projects[0] && <button className="desk-plan-button" onClick={() => setEditing(projects[0])}>{t("planFirstProject")} →</button>}</>}
    </aside>
    <div className="project-search-row">
      <label className="project-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("projectSearchPlaceholder")} aria-label={t("searchProjectsLabel")} />{query && <button onClick={() => setQuery("")} aria-label={t("clearSearch")}>×</button>}</label>
      <div className="project-filters" aria-label={t("projectFilters")}>{(["all", "focus", "risk", "unplanned", "closed"] as ProjectFilter[]).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{t(item === "all" ? "filterAll" : item === "focus" ? "filterFocus" : item === "risk" ? "filterRisk" : item === "unplanned" ? "filterUnplanned" : "filterClosed")}</button>)}</div>
    </div>
    <div className="project-summary"><strong>{query || filter !== "all" ? t("resultsCount", { count: rankedProjects.length }) : t("detectedProjects", { count: projects.length })}</strong><details><summary>{t("searchLocations")}</summary><div className="root-list"><span className="automatic-root">{t("automaticLocations")} · {automaticRoots.length}</span>{customRoots.map((root) => <span className="root-chip" key={root} title={root}>{shortPath(root)}<button aria-label={`${t("removeRoot")} ${root}`} onClick={() => onRemoveRoot(root)}>×</button></span>)}{hiddenCount > 0 && <button className="restore-hidden" onClick={onRestoreHidden}>{t("restoreHidden", { count: hiddenCount })}</button>}</div></details></div>
    {busy && !projects.length ? <div className="project-grid"><LoadingCards /></div> : rankedProjects.length ? <div className="project-grid">{rankedProjects.map(({ project }) => {
      const kind = PROJECT_KINDS[project.kind];
      const plan = plans[project.path];
      const publicUrl = projectLinks[project.path] || project.publicUrl || "";
      const visibleTechnologies = project.technologies.slice(0, 4);
      const remainingTechnologies = project.technologies.length - visibleTechnologies.length;
      return <article className={`project-card kind-${project.kind} ${plan?.focus ? "is-focus" : ""}`} key={project.path}>
        <button className="project-card-main" onClick={() => onSelect(project)}>
          <span className="project-visual"><i>{kind.glyph}</i>{plan && <span className={`phase-badge ${isPlanAtRisk(plan) ? "risk" : ""}`}>{plan.focus ? "● " : ""}{t(`phase${plan.phase[0].toUpperCase()}${plan.phase.slice(1)}` as Parameters<Translator>[0])}</span>}<span className="project-service-list">{project.services.slice(0, 2).map((service) => <b key={service}>{service}</b>)}{!project.services.length && <b>{t("localFolder")}</b>}</span></span>
          <span className="project-copy">
            <small>{PROJECT_TYPES[project.projectType]} · {project.source === "folder" ? t("localFolder") : kind.label}</small>
            <strong>{project.name}</strong>
            <span className="project-description">{project.description || t("noProjectDescription")}</span>
            {plan && <span className={`project-next ${plan.phase === "abandoned" ? "is-released" : ""}`}><b>{plan.phase === "abandoned" ? t("whyStopped") : plan.phase === "done" ? t("doneMeans") : t("next")}</b>{plan.phase === "abandoned" ? plan.abandonedReason || t("noReasonRecorded") : plan.phase === "done" ? plan.definitionOfDone || t("phaseDone") : plan.nextAction || t("missingNextAction")}</span>}
            {plan?.lastSessionAt && plan.phase !== "abandoned" && <span className="last-checkpoint">{t("lastCheckpoint")} · {new Intl.DateTimeFormat(language, { day: "numeric", month: "short" }).format(new Date(plan.lastSessionAt))}</span>}
            <span className={`project-site-status ${publicUrl ? "is-live" : "is-missing"}`}><i>{publicUrl ? "↗" : "—"}</i><span><b>{publicUrl ? project.deploymentService || t("publishedProject") : t("noPublicLink")}</b><small>{publicUrl ? siteHost(publicUrl) : t("addLinkHint")}</small></span></span>
            {!!visibleTechnologies.length && <span className="project-tags">{visibleTechnologies.map((technology) => <i key={technology}>{technology}</i>)}{remainingTechnologies > 0 && <i>+{remainingTechnologies}</i>}</span>}
            <span className="project-path" title={project.path}>{shortPath(project.path)}</span>
          </span>
          <span className="project-use">{t("useProject")} <b>→</b></span>
        </button>
        <span className="project-destination"><button className={publicUrl ? "site-launch" : "site-missing"} onClick={() => publicUrl ? onLink(publicUrl) : setLinking(project)}>{publicUrl ? `${t("openPublished")} ↗` : `＋ ${t("addPublicLink")}`}</button>{publicUrl && <button className="edit-site" onClick={() => setLinking(project)}>{t("editLink")}</button>}{project.repositoryUrl && <button className="repo-launch" onClick={() => onLink(project.repositoryUrl!)}>GitHub ↗</button>}</span>
        <span className="project-card-actions"><button className="project-checkin" onClick={() => setReflecting(project)}>{plan?.phase === "abandoned" ? t("reviewExit") : t("session")}</button><button className="project-plan" onClick={() => setEditing(project)}>{plan ? t("editPlan") : t("planProject")}</button><button className="project-open" onClick={() => onOpen(project)}>{t("openFolder")} ↗</button><button className="project-hide" onClick={() => setHiding(project)} title={t("hideCard")}>×</button></span>
      </article>;
    })}</div> : projects.length ? <div className="projects-empty search-empty"><span>⌕</span><div><h2>{t("noSearchTitle")}</h2><p>{t("noSearchText")}</p></div><button className="refresh-button" onClick={() => { setQuery(""); setFilter("all"); }}>{t("clearSearch")}</button></div> : <div className="projects-empty"><span>◇</span><div><h2>{t("noProjectsTitle")}</h2><p>{t("noProjectsText")}</p></div><button className="small-primary" onClick={onAddRoot}>{t("addProjectFolder")}</button></div>}
    {editing && <ProjectPlanEditor project={editing} initialPlan={plans[editing.path]} focusCount={focusProjects.length} language={language} onCancel={() => setEditing(null)} onSave={(plan) => { onSavePlan(editing, plan, "plan"); setEditing(null); }} t={t} />}
    {reflecting && <SessionCloseEditor project={reflecting} initialPlan={plans[reflecting.path]} onCancel={() => setReflecting(null)} onSave={(plan, abandoned) => { onSavePlan(reflecting, plan, abandoned ? "abandoned" : "checkpoint"); setReflecting(null); }} t={t} />}
    {linking && <ProjectLinkEditor project={linking} initialUrl={projectLinks[linking.path] || linking.publicUrl || ""} onCancel={() => setLinking(null)} onSave={(url) => { onSetLink(linking, url); setLinking(null); }} t={t} />}
    {hiding && <div className="dialog-backdrop" role="presentation"><div className="confirm-card-dialog" role="dialog" aria-modal="true"><span className="confirm-icon">◇</span><h2>{t("hideCardTitle")}</h2><p>{t("hideCardText", { name: hiding.name })}</p><footer><button className="text-button" onClick={() => setHiding(null)}>{t("cancel")}</button><button className="hide-confirm" onClick={() => { onHide(hiding); setHiding(null); }}>{t("hideCardConfirm")}</button></footer></div></div>}
  </section>;
}

function CleanupView({ initialRoot, language, onChooseRoot, onAuthorizeRoot, onNotice, t }: { initialRoot: string; language: Language; onChooseRoot: () => Promise<string | null>; onAuthorizeRoot: (path: string) => Promise<string | null>; onNotice: (message: string) => void; t: Translator }) {
  const [root, setRoot] = useState(initialRoot);
  const [report, setReport] = useState<CleanupReport | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!root && initialRoot) setRoot(initialRoot); }, [initialRoot]);

  const analyze = async (requestedRoot = root) => {
    if (!requestedRoot.trim()) return;
    setBusy(true);
    try {
      const authorized = await onAuthorizeRoot(requestedRoot);
      if (!authorized) return;
      setRoot(authorized);
      const next = await window.launcher.scanCleanup(authorized);
      setReport(next);
      setSelected(new Set(next.items.filter((item) => item.recommendation === "safe").map((item) => item.path)));
    } catch (error) { onNotice(error instanceof Error ? error.message : t("cleanupError")); }
    finally { setBusy(false); }
  };
  const choose = async () => { const chosen = await onChooseRoot(); if (chosen) { setRoot(chosen); await analyze(chosen); } };
  const trash = async () => {
    if (!report || !selected.size) return;
    setBusy(true);
    try {
      const result = await window.launcher.trashCleanupItems(report.root, [...selected], language);
      onNotice(result.message);
      if (result.ok) {
        const next = await window.launcher.scanCleanup(report.root);
        setReport(next);
        setSelected(new Set(next.items.filter((item) => item.recommendation === "safe").map((item) => item.path)));
      }
    } finally { setBusy(false); }
  };
  const toggle = (path: string) => setSelected((current) => { const next = new Set(current); if (next.has(path)) next.delete(path); else next.add(path); return next; });
  const selectedBytes = report?.items.filter((item) => selected.has(item.path)).reduce((sum, item) => sum + item.sizeBytes, 0) || 0;
  const counts = report ? { safe: report.items.filter((item) => item.recommendation === "safe").length, review: report.items.filter((item) => item.recommendation === "review").length, keep: report.items.filter((item) => item.recommendation === "keep").length } : { safe: 0, review: 0, keep: 0 };

  return <section className="content-section cleanup-section">
    <header className="section-heading cleanup-heading"><span className="eyebrow">{t("cleanupEyebrow")}</span><h1>{t("cleanupTitle")}</h1><p>{t("cleanupIntro")}</p></header>
    <div className="cleanup-console"><div className="cleanup-orbit" aria-hidden="true"><span>⌁</span></div><div className="cleanup-path-control"><label><span>{t("folderToAnalyze")}</span><input value={root} onChange={(event) => setRoot(event.target.value)} placeholder="C:\\Users\\…\\mi-proyecto" /></label><div><button className="refresh-button" onClick={() => void choose()}>{t("chooseFolder")}</button><button className="small-primary" disabled={busy || !root.trim()} onClick={() => void analyze()}>{busy ? t("analyzing") : t("analyzeFolder")}</button></div></div></div>
    {!report ? <div className="cleanup-onboarding"><article><span>01</span><b>{t("cleanupStepScan")}</b><p>{t("cleanupStepScanText")}</p></article><article><span>02</span><b>{t("cleanupStepReview")}</b><p>{t("cleanupStepReviewText")}</p></article><article><span>03</span><b>{t("cleanupStepTrash")}</b><p>{t("cleanupStepTrashText")}</p></article></div> : <>
      <div className="cleanup-summary"><div><small>{t("recoverableSpace")}</small><strong>{formatBytes(report.recoverableBytes)}</strong><span title={report.root}>{shortPath(report.root)}</span></div><span className="cleanup-count safe"><b>{counts.safe}</b>{t("safeToClean")}</span><span className="cleanup-count review"><b>{counts.review}</b>{t("reviewFirst")}</span><span className="cleanup-count keep"><b>{counts.keep}</b>{t("protectedItems")}</span></div>
      {report.items.length ? <div className="cleanup-ledger">{report.items.map((item) => <label className={`cleanup-row ${item.recommendation}`} key={item.path}><span className="cleanup-selector">{item.recommendation === "keep" ? <i>◆</i> : <input type="checkbox" checked={selected.has(item.path)} onChange={() => toggle(item.path)} />}</span><span className="cleanup-kind">{item.kind === "dependencies" ? "DEP" : item.kind === "build" ? "BLD" : item.kind === "cache" ? "CCH" : item.kind === "logs" ? "LOG" : item.kind === "empty" ? "Ø" : "LOCK"}</span><span className="cleanup-item-copy"><b>{item.relativePath}</b><small>{item.reason}</small></span><span className="cleanup-size">{item.sizeBytes ? formatBytes(item.sizeBytes) : "—"}</span><span className="cleanup-verdict">{item.recommendation === "safe" ? t("safeToClean") : item.recommendation === "review" ? t("reviewFirst") : t("doNotDelete")}</span></label>)}</div> : <div className="cleanup-empty"><span>✓</span><h2>{t("nothingToClean")}</h2><p>{t("nothingToCleanText")}</p></div>}
      {report.truncated && <p className="cleanup-truncated">{t("cleanupTruncated")}</p>}
      <div className="cleanup-actionbar"><div><b>{t("selectedItems", { count: selected.size })}</b><span>{formatBytes(selectedBytes)} · {t("recycleBinNote")}</span></div><button className="trash-button" disabled={busy || !selected.size} onClick={() => void trash()}>{t("moveToTrash")}</button></div>
    </>}
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

function HelpView({ settings, onSave, onLink, onGoProjects, t }: { settings: LauncherSettings; onSave: (next: LauncherSettings) => void; onLink: (url: string) => void; onGoProjects: () => void; t: Translator }) {
  const toggle = (key: "autoCheckTools" | "autoCheckLauncher" | "startWithWindows") => onSave({ ...settings, [key]: !settings[key] });
  return <section className="content-section">
    <header className="section-heading help-heading"><span className="eyebrow">{t("guideEyebrow")}</span><h1>{t("guideTitle")}</h1><p>{t("guideIntro")}</p><button className="small-primary" onClick={onGoProjects}>{t("openFinishDesk")} →</button></header>
    <div className="finish-method">
      <div><span>01</span><b>{t("methodLimit")}</b><p>{t("methodLimitText")}</p></div>
      <div><span>02</span><b>{t("methodNext")}</b><p>{t("methodNextText")}</p></div>
      <div><span>03</span><b>{t("methodDone")}</b><p>{t("methodDoneText")}</p></div>
    </div>
    <div className="help-grid">
      <article className="steps-panel playbook-panel"><h2>{t("rescuePlaybooks")}</h2><ol><li><b>{t("resumeProject")}</b><span>{t("resumeProjectText")}</span></li><li><b>{t("unblockProject")}</b><span>{t("unblockProjectText")}</span></li><li><b>{t("shipProject")}</b><span>{t("shipProjectText")}</span></li><li><b>{t("releaseProject")}</b><span>{t("releaseProjectText")}</span></li></ol></article>
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
  const visibleProjects = useMemo(() => projects.filter((project) => !isProjectHidden(project.path, settings.hiddenProjects || [])), [projects, settings.hiddenProjects]);

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
  const addProjectRootPath = async (path: string): Promise<boolean> => {
    const result = await window.launcher.authorizeDirectory(path);
    if (!result.ok || !result.path) { setNotice(result.message); return false; }
    const nextRoots = [...new Map([...(settings.projectRoots || []), result.path].map((item) => [item.toLowerCase(), item])).values()];
    await saveSettings({ ...settings, projectRoots: nextRoots }, t("searchFolderAdded"));
    await refreshProjects();
    return true;
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
  const saveProjectPlan = async (project: ProjectInfo, plan: ProjectPlan, result: "plan" | "checkpoint" | "abandoned" = "plan") => {
    const messageKey = result === "checkpoint" ? "checkpointSaved" : result === "abandoned" ? "projectReleased" : "projectPlanSaved";
    await saveSettings({ ...settings, projectPlans: { ...(settings.projectPlans || {}), [project.path]: plan } }, t(messageKey, { name: project.name }));
  };
  const setProjectLink = async (project: ProjectInfo, url: string) => {
    const projectLinks = { ...(settings.projectLinks || {}) };
    if (url) projectLinks[project.path] = url;
    else delete projectLinks[project.path];
    await saveSettings({ ...settings, projectLinks }, url ? t("publicLinkSaved", { name: project.name }) : t("publicLinkRemoved", { name: project.name }));
  };
  const hideProject = async (project: ProjectInfo) => {
    const hiddenProjects = [...new Map([...(settings.hiddenProjects || []), project.path].map((path) => [path.toLowerCase(), path])).values()];
    await saveSettings({ ...settings, hiddenProjects }, t("cardHidden", { name: project.name }));
  };
  const restoreHiddenProjects = async () => saveSettings({ ...settings, hiddenProjects: [] }, t("hiddenRestored"));
  const authorizeDirectory = async (path: string): Promise<string | null> => {
    const result = await window.launcher.authorizeDirectory(path);
    if (!result.ok || !result.path) { setNotice(result.message); return null; }
    return result.path;
  };
  const chooseCleanupRoot = async () => window.launcher.selectProject(language);
  const runAction = async (tool: ToolId, action: ToolAction) => setNotice((await window.launcher.runAction(tool, action, language)).message);
  const selfUpdate = async () => setNotice((await window.launcher.checkLauncherUpdate(language)).message);
  const openLink = (url: string) => void window.launcher.openLink(url).catch((error) => setNotice(error instanceof Error ? error.message : t("publicLinkInvalid")));
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
        {view === "projects" && <ProjectsView projects={visibleProjects} plans={settings.projectPlans || {}} projectLinks={settings.projectLinks || {}} hiddenCount={(settings.hiddenProjects || []).length} customRoots={settings.projectRoots || []} automaticRoots={automaticRoots} busy={projectsBusy} language={language} onAddRoot={addProjectRoot} onAddRootPath={addProjectRootPath} onRemoveRoot={removeProjectRoot} onRestoreHidden={restoreHiddenProjects} onScan={() => void refreshProjects()} onSelect={selectLibraryProject} onOpen={openProjectFolder} onLink={openLink} onSetLink={setProjectLink} onHide={hideProject} onSavePlan={saveProjectPlan} t={t} />}
        {view === "cleanup" && <CleanupView initialRoot={settings.projectPath} language={language} onChooseRoot={chooseCleanupRoot} onAuthorizeRoot={authorizeDirectory} onNotice={setNotice} t={t} />}
        {view === "accounts" && <AccountsView tools={tools} onAction={runAction} onLink={openLink} t={t} />}
        {view === "inventory" && <InventoryView tools={tools} onLink={openLink} t={t} />}
        {view === "updates" && <UpdatesView tools={tools} busy={busy} onScan={() => void scan(true)} onAction={runAction} onSelfUpdate={selfUpdate} t={t} />}
        {view === "help" && <HelpView settings={settings} onSave={saveSettings} onLink={openLink} onGoProjects={() => setView("projects")} t={t} />}
      </div>
    </main>
    {notice && <button className="toast" onClick={() => setNotice("")}><span>{notice}</span><b>×</b></button>}
  </div>;
}
