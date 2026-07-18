import type { Language } from "../shared/types";

type MainMessage = "chooseProject" | "actionDenied" | "terminalOpened" | "terminalFailed" | "updaterInstalledOnly" | "launcherCurrent" | "updateChecked" | "updateChannelUnavailable";

const messages: Record<Language, Record<MainMessage, string>> = {
  es: { chooseProject: "Elige la carpeta del proyecto", actionDenied: "Acción no permitida", terminalOpened: "Terminal abierta para {tool}.", terminalFailed: "No se pudo abrir la terminal.", updaterInstalledOnly: "El actualizador se activa en la versión instalada.", launcherCurrent: "Jota AI Launcher está al día.", updateChecked: "Actualización comprobada.", updateChannelUnavailable: "No se pudo consultar el canal público de actualizaciones." },
  en: { chooseProject: "Choose the project folder", actionDenied: "Action not allowed", terminalOpened: "Terminal opened for {tool}.", terminalFailed: "The terminal could not be opened.", updaterInstalledOnly: "The updater is enabled in the installed version.", launcherCurrent: "Jota AI Launcher is up to date.", updateChecked: "Update checked.", updateChannelUnavailable: "The public update channel could not be checked." },
  fr: { chooseProject: "Choisissez le dossier du projet", actionDenied: "Action non autorisée", terminalOpened: "Terminal ouvert pour {tool}.", terminalFailed: "Impossible d’ouvrir le terminal.", updaterInstalledOnly: "La mise à jour est activée dans la version installée.", launcherCurrent: "Jota AI Launcher est à jour.", updateChecked: "Mise à jour vérifiée.", updateChannelUnavailable: "Impossible de consulter le canal public des mises à jour." },
  pt: { chooseProject: "Escolha a pasta do projeto", actionDenied: "Ação não permitida", terminalOpened: "Terminal aberto para {tool}.", terminalFailed: "Não foi possível abrir o terminal.", updaterInstalledOnly: "O atualizador é ativado na versão instalada.", launcherCurrent: "O Jota AI Launcher está atualizado.", updateChecked: "Atualização verificada.", updateChannelUnavailable: "Não foi possível consultar o canal público de atualizações." },
  it: { chooseProject: "Scegli la cartella del progetto", actionDenied: "Azione non consentita", terminalOpened: "Terminale aperto per {tool}.", terminalFailed: "Impossibile aprire il terminale.", updaterInstalledOnly: "L’aggiornamento è attivo nella versione installata.", launcherCurrent: "Jota AI Launcher è aggiornato.", updateChecked: "Aggiornamento controllato.", updateChannelUnavailable: "Impossibile controllare il canale pubblico degli aggiornamenti." },
  de: { chooseProject: "Projektordner auswählen", actionDenied: "Aktion nicht erlaubt", terminalOpened: "Terminal für {tool} geöffnet.", terminalFailed: "Das Terminal konnte nicht geöffnet werden.", updaterInstalledOnly: "Die Aktualisierung ist in der installierten Version aktiviert.", launcherCurrent: "Jota AI Launcher ist aktuell.", updateChecked: "Aktualisierung geprüft.", updateChannelUnavailable: "Der öffentliche Aktualisierungskanal konnte nicht geprüft werden." },
};

export function normalizeLanguage(value: unknown): Language {
  const code = String(value || "").toLowerCase().split(/[-_]/)[0];
  return (["es", "en", "fr", "pt", "it", "de"] as const).includes(code as Language) ? code as Language : "en";
}

export function mainText(language: Language, key: MainMessage, values: Record<string, string> = {}): string {
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), messages[language][key]);
}
