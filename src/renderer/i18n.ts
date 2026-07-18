import type { Language } from "../shared/types";

export const LANGUAGES: Array<{ code: Language; label: string }> = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
];

const es = {
  navLaunch: "Lanzar", navProjects: "Proyectos", navAccounts: "Cuentas", navInventory: "Inventario", navUpdates: "Actualizaciones", navHelp: "Guía y ajustes",
  ready: "Listo", notInstalled: "No instalado", plugins: "plugins", skills: "skills", connectedAccount: "Cuenta conectada", connectMissing: "Falta conectar",
  start: "Iniciar", resume: "Continuar sesión", install: "Instalar",
  launchEyebrow: "Bahía de lanzamiento", launchTitle1: "Elige el proyecto.", launchTitle2: "Enciende el agente.", launchIntro: "Tres herramientas, una sola puerta de entrada y ninguna credencial compartida.",
  activeProject: "Proyecto activo", chooseFolder: "Elegir una carpeta", changeFolder: "Cambiar carpeta", availableAgents: "Agentes disponibles",
  privateTitle: "Sesiones privadas por diseño", privateText: "El launcher no incluye ni copia tus claves. Cada usuario inicia sesión directamente con el proveedor elegido.",
  accountsEyebrow: "Identidad local", accountsTitle: "Tus cuentas viven fuera del launcher.", accountsIntro: "Cada proveedor conserva su acceso en el perfil actual del sistema. Al compartir el instalador, los demás comienzan desde cero.",
  connected: "Conectada", disconnected: "Sin conectar", changeAccount: "Cambiar cuenta", signIn: "Iniciar sesión", signOut: "Cerrar sesión", manageAccount: "Gestionar cuenta",
  sharedComputer: "Para equipos compartidos", sharedComputerText: "Usa una cuenta del sistema distinta por persona. Así también quedan separados los historiales, configuraciones y credenciales guardados por cada CLI.",
  inventoryEyebrow: "Mesa de diagnóstico", inventoryTitle: "Todo lo que cada agente carga.", installedCount: "{count} instalados", availableCount: "{count} disponibles", active: "Activo", user: "usuario",
  noPlugins: "No se detectaron plugins instalados.", noSkills: "No se detectaron skills.", mcpDetected: "Servidores MCP detectados", technicalOutput: "Ver salida técnica", noMcp: "Sin servidores MCP detectados o herramienta no instalada.", openDocs: "Abrir documentación de {tool}",
  maintenance: "Mantenimiento", updatesTitle: "Versiones claras, cambios bajo control.", updatesIntro: "La comprobación es automática. Las actualizaciones abren la terminal para que puedas ver exactamente qué cambia.", checking: "Comprobando…", checkNow: "Comprobar ahora", noHiddenInstallers: "No se ejecutan instaladores ocultos.",
  notChecked: "Sin comprobar", detectedInstall: "Instalación detectada", notYetInstalled: "Aún no está instalado", current: "Actual", available: "Disponible", upToDate: "Al día", update: "Actualizar", launcherChannel: "Canal de actualización del instalador", searchUpdate: "Buscar actualización",
  guideEyebrow: "Guía y ajustes", guideTitle: "Una puerta, tres maneras de trabajar.", howToStart: "Cómo empezar", stepProject: "Elige un proyecto", stepProjectText: "Selecciona la carpeta que contiene tu código.", stepAccount: "Conecta tu cuenta", stepAccountText: "El proveedor abre su propio acceso seguro.", stepAgent: "Inicia el agente", stepAgentText: "La terminal se abre en la carpeta correcta.",
  preferences: "Preferencias", checkTools: "Comprobar herramientas", checkToolsText: "Busca nuevas versiones al iniciar", updateLauncher: "Actualizar el launcher", updateLauncherText: "Comprueba el canal de versiones", startSystem: "Iniciar con el sistema", startSystemText: "Abre el panel al entrar en tu cuenta",
  missingTool: "¿Falta alguna herramienta?", officialRequirements: "Consulta su instalación y requisitos oficiales.", localPanel: "Panel local", readingSystem: "Leyendo el sistema…", shellReady: "{shell} listo", refreshStatus: "Actualizar estado", language: "Idioma", settingsSaved: "Preferencias guardadas.", diagnosticError: "No se pudo completar el diagnóstico.",
  projectsEyebrow: "Biblioteca local", projectsTitle: "Tus proyectos, listos para abrir.", projectsIntro: "Detectamos carpetas con código y las convertimos en accesos directos para tus agentes.", addProjectFolder: "Añadir carpeta", scanProjects: "Buscar proyectos", scanningProjects: "Buscando…", useProject: "Usar proyecto", openFolder: "Abrir carpeta", projectSelected: "Proyecto seleccionado: {name}", projectFolderOpened: "Carpeta abierta.", noProjectsTitle: "Todavía no encontramos proyectos.", noProjectsText: "Añade la carpeta donde guardas tu código y buscaremos proyectos dentro.", detectedProjects: "{count} proyectos detectados", searchLocations: "Carpetas de búsqueda", automaticLocations: "Ubicaciones habituales incluidas", removeRoot: "Quitar", folderOpenError: "No se pudo abrir la carpeta.",
  codexSubtitle: "Agente de OpenAI", claudeSubtitle: "Agente de Anthropic", opencodeSubtitle: "Agente abierto multimodelo",
};

type TranslationKey = keyof typeof es;
type Dictionary = Record<TranslationKey, string>;

const en: Dictionary = {
  navLaunch: "Launch", navProjects: "Projects", navAccounts: "Accounts", navInventory: "Inventory", navUpdates: "Updates", navHelp: "Guide & settings",
  ready: "Ready", notInstalled: "Not installed", plugins: "plugins", skills: "skills", connectedAccount: "Account connected", connectMissing: "Connect account",
  start: "Start", resume: "Resume session", install: "Install",
  launchEyebrow: "Launch bay", launchTitle1: "Choose the project.", launchTitle2: "Power up the agent.", launchIntro: "Three tools, one gateway, and no shared credentials.",
  activeProject: "Active project", chooseFolder: "Choose a folder", changeFolder: "Change folder", availableAgents: "Available agents",
  privateTitle: "Private sessions by design", privateText: "The launcher neither includes nor copies your keys. Each user signs in directly with the chosen provider.",
  accountsEyebrow: "Local identity", accountsTitle: "Your accounts live outside the launcher.", accountsIntro: "Each provider keeps access in the current system profile. When you share the installer, everyone else starts from scratch.",
  connected: "Connected", disconnected: "Not connected", changeAccount: "Change account", signIn: "Sign in", signOut: "Sign out", manageAccount: "Manage account",
  sharedComputer: "For shared computers", sharedComputerText: "Use a separate system account for each person. This also keeps each CLI's history, settings, and stored credentials separate.",
  inventoryEyebrow: "Diagnostics desk", inventoryTitle: "Everything each agent loads.", installedCount: "{count} installed", availableCount: "{count} available", active: "Active", user: "user",
  noPlugins: "No installed plugins were detected.", noSkills: "No skills were detected.", mcpDetected: "Detected MCP servers", technicalOutput: "View technical output", noMcp: "No MCP servers detected or tool not installed.", openDocs: "Open {tool} documentation",
  maintenance: "Maintenance", updatesTitle: "Clear versions, controlled changes.", updatesIntro: "Checks are automatic. Updates open the terminal so you can see exactly what changes.", checking: "Checking…", checkNow: "Check now", noHiddenInstallers: "No hidden installers are run.",
  notChecked: "Not checked", detectedInstall: "Installation detected", notYetInstalled: "Not installed yet", current: "Current", available: "Available", upToDate: "Up to date", update: "Update", launcherChannel: "Launcher update channel", searchUpdate: "Check for updates",
  guideEyebrow: "Guide & settings", guideTitle: "One gateway, three ways to work.", howToStart: "Getting started", stepProject: "Choose a project", stepProjectText: "Select the folder that contains your code.", stepAccount: "Connect your account", stepAccountText: "The provider opens its own secure sign-in.", stepAgent: "Start the agent", stepAgentText: "The terminal opens in the correct folder.",
  preferences: "Preferences", checkTools: "Check tools", checkToolsText: "Look for new versions at startup", updateLauncher: "Update the launcher", updateLauncherText: "Check the release channel", startSystem: "Start with the system", startSystemText: "Open the panel when you sign in",
  missingTool: "Missing a tool?", officialRequirements: "View its official installation guide and requirements.", localPanel: "Local panel", readingSystem: "Reading the system…", shellReady: "{shell} ready", refreshStatus: "Refresh status", language: "Language", settingsSaved: "Preferences saved.", diagnosticError: "The diagnostic could not be completed.",
  projectsEyebrow: "Local library", projectsTitle: "Your projects, ready to open.", projectsIntro: "We detect folders with code and turn them into shortcuts for your agents.", addProjectFolder: "Add folder", scanProjects: "Find projects", scanningProjects: "Searching…", useProject: "Use project", openFolder: "Open folder", projectSelected: "Project selected: {name}", projectFolderOpened: "Folder opened.", noProjectsTitle: "No projects found yet.", noProjectsText: "Add the folder where you keep your code and we will find projects inside it.", detectedProjects: "{count} projects detected", searchLocations: "Search folders", automaticLocations: "Common locations included", removeRoot: "Remove", folderOpenError: "The folder could not be opened.",
  codexSubtitle: "OpenAI agent", claudeSubtitle: "Anthropic agent", opencodeSubtitle: "Open multimodel agent",
};

const fr: Dictionary = {
  navLaunch: "Lancer", navProjects: "Projets", navAccounts: "Comptes", navInventory: "Inventaire", navUpdates: "Mises à jour", navHelp: "Guide et réglages",
  ready: "Prêt", notInstalled: "Non installé", plugins: "plugins", skills: "skills", connectedAccount: "Compte connecté", connectMissing: "Connexion requise",
  start: "Démarrer", resume: "Reprendre la session", install: "Installer",
  launchEyebrow: "Baie de lancement", launchTitle1: "Choisissez le projet.", launchTitle2: "Activez l’agent.", launchIntro: "Trois outils, une seule porte d’entrée et aucun identifiant partagé.",
  activeProject: "Projet actif", chooseFolder: "Choisir un dossier", changeFolder: "Changer de dossier", availableAgents: "Agents disponibles",
  privateTitle: "Sessions privées par conception", privateText: "Le launcher n’inclut ni ne copie vos clés. Chaque utilisateur se connecte directement auprès du fournisseur choisi.",
  accountsEyebrow: "Identité locale", accountsTitle: "Vos comptes restent hors du launcher.", accountsIntro: "Chaque fournisseur conserve l’accès dans le profil système actuel. Lorsque vous partagez l’installateur, les autres repartent de zéro.",
  connected: "Connecté", disconnected: "Non connecté", changeAccount: "Changer de compte", signIn: "Se connecter", signOut: "Se déconnecter", manageAccount: "Gérer le compte",
  sharedComputer: "Pour les ordinateurs partagés", sharedComputerText: "Utilisez un compte système différent pour chaque personne. Les historiques, réglages et identifiants enregistrés par chaque CLI restent ainsi séparés.",
  inventoryEyebrow: "Table de diagnostic", inventoryTitle: "Tout ce que chaque agent charge.", installedCount: "{count} installés", availableCount: "{count} disponibles", active: "Actif", user: "utilisateur",
  noPlugins: "Aucun plugin installé détecté.", noSkills: "Aucun skill détecté.", mcpDetected: "Serveurs MCP détectés", technicalOutput: "Voir la sortie technique", noMcp: "Aucun serveur MCP détecté ou outil non installé.", openDocs: "Ouvrir la documentation de {tool}",
  maintenance: "Maintenance", updatesTitle: "Versions claires, changements maîtrisés.", updatesIntro: "La vérification est automatique. Les mises à jour ouvrent le terminal afin que vous puissiez voir précisément les changements.", checking: "Vérification…", checkNow: "Vérifier maintenant", noHiddenInstallers: "Aucun installateur caché n’est exécuté.",
  notChecked: "Non vérifié", detectedInstall: "Installation détectée", notYetInstalled: "Pas encore installé", current: "Actuelle", available: "Disponible", upToDate: "À jour", update: "Mettre à jour", launcherChannel: "Canal de mise à jour du launcher", searchUpdate: "Rechercher une mise à jour",
  guideEyebrow: "Guide et réglages", guideTitle: "Une porte, trois façons de travailler.", howToStart: "Bien démarrer", stepProject: "Choisissez un projet", stepProjectText: "Sélectionnez le dossier contenant votre code.", stepAccount: "Connectez votre compte", stepAccountText: "Le fournisseur ouvre sa propre connexion sécurisée.", stepAgent: "Démarrez l’agent", stepAgentText: "Le terminal s’ouvre dans le bon dossier.",
  preferences: "Préférences", checkTools: "Vérifier les outils", checkToolsText: "Rechercher de nouvelles versions au démarrage", updateLauncher: "Mettre à jour le launcher", updateLauncherText: "Vérifier le canal des versions", startSystem: "Démarrer avec le système", startSystemText: "Ouvrir le panneau à la connexion",
  missingTool: "Un outil vous manque ?", officialRequirements: "Consultez son installation et ses prérequis officiels.", localPanel: "Panneau local", readingSystem: "Lecture du système…", shellReady: "{shell} prêt", refreshStatus: "Actualiser l’état", language: "Langue", settingsSaved: "Préférences enregistrées.", diagnosticError: "Le diagnostic n’a pas pu être terminé.",
  projectsEyebrow: "Bibliothèque locale", projectsTitle: "Vos projets, prêts à s’ouvrir.", projectsIntro: "Nous détectons les dossiers de code et les transformons en raccourcis pour vos agents.", addProjectFolder: "Ajouter un dossier", scanProjects: "Rechercher des projets", scanningProjects: "Recherche…", useProject: "Utiliser le projet", openFolder: "Ouvrir le dossier", projectSelected: "Projet sélectionné : {name}", projectFolderOpened: "Dossier ouvert.", noProjectsTitle: "Aucun projet trouvé pour le moment.", noProjectsText: "Ajoutez le dossier où se trouve votre code et nous rechercherons les projets qu’il contient.", detectedProjects: "{count} projets détectés", searchLocations: "Dossiers de recherche", automaticLocations: "Emplacements habituels inclus", removeRoot: "Retirer", folderOpenError: "Impossible d’ouvrir le dossier.",
  codexSubtitle: "Agent d’OpenAI", claudeSubtitle: "Agent d’Anthropic", opencodeSubtitle: "Agent ouvert multimodèle",
};

const pt: Dictionary = {
  navLaunch: "Iniciar", navProjects: "Projetos", navAccounts: "Contas", navInventory: "Inventário", navUpdates: "Atualizações", navHelp: "Guia e definições",
  ready: "Pronto", notInstalled: "Não instalado", plugins: "plugins", skills: "skills", connectedAccount: "Conta ligada", connectMissing: "Falta ligar",
  start: "Iniciar", resume: "Continuar sessão", install: "Instalar",
  launchEyebrow: "Baía de lançamento", launchTitle1: "Escolha o projeto.", launchTitle2: "Ative o agente.", launchIntro: "Três ferramentas, uma única entrada e nenhuma credencial partilhada.",
  activeProject: "Projeto ativo", chooseFolder: "Escolher uma pasta", changeFolder: "Mudar pasta", availableAgents: "Agentes disponíveis",
  privateTitle: "Sessões privadas por design", privateText: "O launcher não inclui nem copia as suas chaves. Cada utilizador inicia sessão diretamente no fornecedor escolhido.",
  accountsEyebrow: "Identidade local", accountsTitle: "As suas contas vivem fora do launcher.", accountsIntro: "Cada fornecedor mantém o acesso no perfil atual do sistema. Ao partilhar o instalador, os outros começam do zero.",
  connected: "Ligada", disconnected: "Não ligada", changeAccount: "Mudar conta", signIn: "Iniciar sessão", signOut: "Terminar sessão", manageAccount: "Gerir conta",
  sharedComputer: "Para computadores partilhados", sharedComputerText: "Use uma conta do sistema diferente para cada pessoa. Assim, os históricos, as definições e as credenciais guardadas por cada CLI também ficam separados.",
  inventoryEyebrow: "Mesa de diagnóstico", inventoryTitle: "Tudo o que cada agente carrega.", installedCount: "{count} instalados", availableCount: "{count} disponíveis", active: "Ativo", user: "utilizador",
  noPlugins: "Não foram detetados plugins instalados.", noSkills: "Não foram detetados skills.", mcpDetected: "Servidores MCP detetados", technicalOutput: "Ver saída técnica", noMcp: "Nenhum servidor MCP detetado ou ferramenta não instalada.", openDocs: "Abrir documentação de {tool}",
  maintenance: "Manutenção", updatesTitle: "Versões claras, alterações controladas.", updatesIntro: "A verificação é automática. As atualizações abrem o terminal para que possa ver exatamente o que muda.", checking: "A verificar…", checkNow: "Verificar agora", noHiddenInstallers: "Não são executados instaladores ocultos.",
  notChecked: "Não verificado", detectedInstall: "Instalação detetada", notYetInstalled: "Ainda não está instalado", current: "Atual", available: "Disponível", upToDate: "Atualizado", update: "Atualizar", launcherChannel: "Canal de atualização do launcher", searchUpdate: "Procurar atualização",
  guideEyebrow: "Guia e definições", guideTitle: "Uma entrada, três formas de trabalhar.", howToStart: "Como começar", stepProject: "Escolha um projeto", stepProjectText: "Selecione a pasta que contém o seu código.", stepAccount: "Ligue a sua conta", stepAccountText: "O fornecedor abre o seu próprio acesso seguro.", stepAgent: "Inicie o agente", stepAgentText: "O terminal abre na pasta correta.",
  preferences: "Preferências", checkTools: "Verificar ferramentas", checkToolsText: "Procurar novas versões ao iniciar", updateLauncher: "Atualizar o launcher", updateLauncherText: "Verificar o canal de versões", startSystem: "Iniciar com o sistema", startSystemText: "Abrir o painel ao entrar na conta",
  missingTool: "Falta alguma ferramenta?", officialRequirements: "Consulte a instalação e os requisitos oficiais.", localPanel: "Painel local", readingSystem: "A ler o sistema…", shellReady: "{shell} pronto", refreshStatus: "Atualizar estado", language: "Idioma", settingsSaved: "Preferências guardadas.", diagnosticError: "Não foi possível concluir o diagnóstico.",
  projectsEyebrow: "Biblioteca local", projectsTitle: "Os seus projetos, prontos a abrir.", projectsIntro: "Detetamos pastas com código e transformamo-las em atalhos para os seus agentes.", addProjectFolder: "Adicionar pasta", scanProjects: "Procurar projetos", scanningProjects: "A procurar…", useProject: "Usar projeto", openFolder: "Abrir pasta", projectSelected: "Projeto selecionado: {name}", projectFolderOpened: "Pasta aberta.", noProjectsTitle: "Ainda não encontrámos projetos.", noProjectsText: "Adicione a pasta onde guarda o código e procuraremos projetos dentro dela.", detectedProjects: "{count} projetos detetados", searchLocations: "Pastas de pesquisa", automaticLocations: "Localizações habituais incluídas", removeRoot: "Remover", folderOpenError: "Não foi possível abrir a pasta.",
  codexSubtitle: "Agente da OpenAI", claudeSubtitle: "Agente da Anthropic", opencodeSubtitle: "Agente aberto multimodelo",
};

const it: Dictionary = {
  navLaunch: "Avvia", navProjects: "Progetti", navAccounts: "Account", navInventory: "Inventario", navUpdates: "Aggiornamenti", navHelp: "Guida e impostazioni",
  ready: "Pronto", notInstalled: "Non installato", plugins: "plugin", skills: "skill", connectedAccount: "Account collegato", connectMissing: "Da collegare",
  start: "Avvia", resume: "Continua sessione", install: "Installa",
  launchEyebrow: "Baia di lancio", launchTitle1: "Scegli il progetto.", launchTitle2: "Attiva l’agente.", launchIntro: "Tre strumenti, un solo punto di accesso e nessuna credenziale condivisa.",
  activeProject: "Progetto attivo", chooseFolder: "Scegli una cartella", changeFolder: "Cambia cartella", availableAgents: "Agenti disponibili",
  privateTitle: "Sessioni private per progettazione", privateText: "Il launcher non include né copia le tue chiavi. Ogni utente accede direttamente tramite il provider scelto.",
  accountsEyebrow: "Identità locale", accountsTitle: "I tuoi account restano fuori dal launcher.", accountsIntro: "Ogni provider conserva l’accesso nel profilo di sistema corrente. Quando condividi l’installer, gli altri iniziano da zero.",
  connected: "Collegato", disconnected: "Non collegato", changeAccount: "Cambia account", signIn: "Accedi", signOut: "Esci", manageAccount: "Gestisci account",
  sharedComputer: "Per computer condivisi", sharedComputerText: "Usa un account di sistema diverso per ogni persona. In questo modo anche cronologia, impostazioni e credenziali salvate da ogni CLI restano separate.",
  inventoryEyebrow: "Banco di diagnostica", inventoryTitle: "Tutto ciò che ogni agente carica.", installedCount: "{count} installati", availableCount: "{count} disponibili", active: "Attivo", user: "utente",
  noPlugins: "Nessun plugin installato rilevato.", noSkills: "Nessuna skill rilevata.", mcpDetected: "Server MCP rilevati", technicalOutput: "Vedi output tecnico", noMcp: "Nessun server MCP rilevato o strumento non installato.", openDocs: "Apri la documentazione di {tool}",
  maintenance: "Manutenzione", updatesTitle: "Versioni chiare, modifiche sotto controllo.", updatesIntro: "Il controllo è automatico. Gli aggiornamenti aprono il terminale così puoi vedere esattamente cosa cambia.", checking: "Controllo…", checkNow: "Controlla ora", noHiddenInstallers: "Non vengono eseguiti installer nascosti.",
  notChecked: "Non controllato", detectedInstall: "Installazione rilevata", notYetInstalled: "Non ancora installato", current: "Attuale", available: "Disponibile", upToDate: "Aggiornato", update: "Aggiorna", launcherChannel: "Canale di aggiornamento del launcher", searchUpdate: "Cerca aggiornamenti",
  guideEyebrow: "Guida e impostazioni", guideTitle: "Un accesso, tre modi di lavorare.", howToStart: "Come iniziare", stepProject: "Scegli un progetto", stepProjectText: "Seleziona la cartella che contiene il codice.", stepAccount: "Collega il tuo account", stepAccountText: "Il provider apre il proprio accesso sicuro.", stepAgent: "Avvia l’agente", stepAgentText: "Il terminale si apre nella cartella corretta.",
  preferences: "Preferenze", checkTools: "Controlla strumenti", checkToolsText: "Cerca nuove versioni all’avvio", updateLauncher: "Aggiorna il launcher", updateLauncherText: "Controlla il canale delle versioni", startSystem: "Avvia con il sistema", startSystemText: "Apri il pannello all’accesso",
  missingTool: "Manca uno strumento?", officialRequirements: "Consulta l’installazione e i requisiti ufficiali.", localPanel: "Pannello locale", readingSystem: "Lettura del sistema…", shellReady: "{shell} pronto", refreshStatus: "Aggiorna stato", language: "Lingua", settingsSaved: "Preferenze salvate.", diagnosticError: "Impossibile completare la diagnostica.",
  projectsEyebrow: "Libreria locale", projectsTitle: "I tuoi progetti, pronti da aprire.", projectsIntro: "Rileviamo le cartelle con codice e le trasformiamo in collegamenti per i tuoi agenti.", addProjectFolder: "Aggiungi cartella", scanProjects: "Cerca progetti", scanningProjects: "Ricerca…", useProject: "Usa progetto", openFolder: "Apri cartella", projectSelected: "Progetto selezionato: {name}", projectFolderOpened: "Cartella aperta.", noProjectsTitle: "Nessun progetto trovato.", noProjectsText: "Aggiungi la cartella in cui conservi il codice e cercheremo i progetti al suo interno.", detectedProjects: "{count} progetti rilevati", searchLocations: "Cartelle di ricerca", automaticLocations: "Posizioni abituali incluse", removeRoot: "Rimuovi", folderOpenError: "Impossibile aprire la cartella.",
  codexSubtitle: "Agente OpenAI", claudeSubtitle: "Agente Anthropic", opencodeSubtitle: "Agente aperto multimodello",
};

const de: Dictionary = {
  navLaunch: "Starten", navProjects: "Projekte", navAccounts: "Konten", navInventory: "Inventar", navUpdates: "Aktualisierungen", navHelp: "Hilfe & Einstellungen",
  ready: "Bereit", notInstalled: "Nicht installiert", plugins: "Plugins", skills: "Skills", connectedAccount: "Konto verbunden", connectMissing: "Verbindung fehlt",
  start: "Starten", resume: "Sitzung fortsetzen", install: "Installieren",
  launchEyebrow: "Startbereich", launchTitle1: "Projekt auswählen.", launchTitle2: "Agenten starten.", launchIntro: "Drei Werkzeuge, ein Zugang und keine gemeinsam genutzten Anmeldedaten.",
  activeProject: "Aktives Projekt", chooseFolder: "Ordner auswählen", changeFolder: "Ordner wechseln", availableAgents: "Verfügbare Agenten",
  privateTitle: "Private Sitzungen als Grundprinzip", privateText: "Der Launcher enthält oder kopiert keine Schlüssel. Jeder Benutzer meldet sich direkt beim gewählten Anbieter an.",
  accountsEyebrow: "Lokale Identität", accountsTitle: "Deine Konten bleiben außerhalb des Launchers.", accountsIntro: "Jeder Anbieter speichert den Zugang im aktuellen Systemprofil. Wird der Installer geteilt, beginnen andere bei null.",
  connected: "Verbunden", disconnected: "Nicht verbunden", changeAccount: "Konto wechseln", signIn: "Anmelden", signOut: "Abmelden", manageAccount: "Konto verwalten",
  sharedComputer: "Für gemeinsam genutzte Computer", sharedComputerText: "Verwende für jede Person ein eigenes Systemkonto. So bleiben auch Verläufe, Einstellungen und gespeicherte Zugangsdaten der einzelnen CLIs getrennt.",
  inventoryEyebrow: "Diagnosebereich", inventoryTitle: "Alles, was jeder Agent lädt.", installedCount: "{count} installiert", availableCount: "{count} verfügbar", active: "Aktiv", user: "Benutzer",
  noPlugins: "Keine installierten Plugins erkannt.", noSkills: "Keine Skills erkannt.", mcpDetected: "Erkannte MCP-Server", technicalOutput: "Technische Ausgabe anzeigen", noMcp: "Keine MCP-Server erkannt oder Werkzeug nicht installiert.", openDocs: "Dokumentation für {tool} öffnen",
  maintenance: "Wartung", updatesTitle: "Klare Versionen, kontrollierte Änderungen.", updatesIntro: "Die Prüfung läuft automatisch. Aktualisierungen öffnen das Terminal, damit du genau siehst, was sich ändert.", checking: "Wird geprüft…", checkNow: "Jetzt prüfen", noHiddenInstallers: "Es werden keine versteckten Installer ausgeführt.",
  notChecked: "Nicht geprüft", detectedInstall: "Installation erkannt", notYetInstalled: "Noch nicht installiert", current: "Aktuell", available: "Verfügbar", upToDate: "Aktuell", update: "Aktualisieren", launcherChannel: "Aktualisierungskanal des Launchers", searchUpdate: "Nach Aktualisierung suchen",
  guideEyebrow: "Hilfe & Einstellungen", guideTitle: "Ein Zugang, drei Arbeitsweisen.", howToStart: "Erste Schritte", stepProject: "Projekt auswählen", stepProjectText: "Wähle den Ordner aus, der deinen Code enthält.", stepAccount: "Konto verbinden", stepAccountText: "Der Anbieter öffnet seine eigene sichere Anmeldung.", stepAgent: "Agenten starten", stepAgentText: "Das Terminal öffnet sich im richtigen Ordner.",
  preferences: "Einstellungen", checkTools: "Werkzeuge prüfen", checkToolsText: "Beim Start nach neuen Versionen suchen", updateLauncher: "Launcher aktualisieren", updateLauncherText: "Versionskanal prüfen", startSystem: "Mit dem System starten", startSystemText: "Panel bei der Anmeldung öffnen",
  missingTool: "Fehlt ein Werkzeug?", officialRequirements: "Offizielle Installation und Anforderungen ansehen.", localPanel: "Lokales Panel", readingSystem: "System wird gelesen…", shellReady: "{shell} bereit", refreshStatus: "Status aktualisieren", language: "Sprache", settingsSaved: "Einstellungen gespeichert.", diagnosticError: "Die Diagnose konnte nicht abgeschlossen werden.",
  projectsEyebrow: "Lokale Bibliothek", projectsTitle: "Deine Projekte, sofort startklar.", projectsIntro: "Wir erkennen Code-Ordner und machen sie zu direkten Zugängen für deine Agenten.", addProjectFolder: "Ordner hinzufügen", scanProjects: "Projekte suchen", scanningProjects: "Suche…", useProject: "Projekt verwenden", openFolder: "Ordner öffnen", projectSelected: "Projekt ausgewählt: {name}", projectFolderOpened: "Ordner geöffnet.", noProjectsTitle: "Noch keine Projekte gefunden.", noProjectsText: "Füge den Ordner hinzu, in dem dein Code liegt; wir suchen darin nach Projekten.", detectedProjects: "{count} Projekte erkannt", searchLocations: "Suchordner", automaticLocations: "Übliche Speicherorte enthalten", removeRoot: "Entfernen", folderOpenError: "Der Ordner konnte nicht geöffnet werden.",
  codexSubtitle: "Agent von OpenAI", claudeSubtitle: "Agent von Anthropic", opencodeSubtitle: "Offener Multimodell-Agent",
};

const dictionaries: Record<Language, Dictionary> = { es, en, fr, pt, it, de };

export function translate(language: Language, key: TranslationKey, values: Record<string, string | number> = {}): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    dictionaries[language][key],
  );
}

export type Translator = (key: TranslationKey, values?: Record<string, string | number>) => string;
