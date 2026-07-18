# Jota AI Launcher

Aplicación de escritorio multilingüe para Windows y macOS que detecta, inicia y mantiene Codex, Claude Code y OpenCode desde una sola interfaz.

[![CI](https://github.com/JotaEse68/jota-ai-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/JotaEse68/jota-ai-launcher/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/JotaEse68/jota-ai-launcher?display_name=tag)](https://github.com/JotaEse68/jota-ai-launcher/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-2855d9.svg)](./LICENSE)

![Panel principal de Jota AI Launcher](./launcher-home.png)

## Privacidad

El instalador no contiene cuentas, contraseñas ni claves API. Cada CLI gestiona sus credenciales en el perfil local del sistema. Para un ordenador compartido, se recomienda una cuenta del sistema por persona.

Consulta la [política de privacidad](./PRIVACY.md) para ver qué información lee el launcher y qué información no recopila.

## Seguridad y confianza

Jota AI Launcher es código abierto. No pedimos que confíes únicamente en una promesa: puedes revisar el código, comprobar de qué commit procede el instalador y analizarlo antes de abrirlo.

- **Compilación pública:** cada release se construye en GitHub Actions desde el código visible en este repositorio.
- **Procedencia verificable:** GitHub genera una atestación criptográfica que vincula los instaladores `.exe` y `.dmg` con el workflow y el commit que los produjeron.
- **Integridad:** cada release incluye `SHA256SUMS.txt` para detectar cualquier modificación del instalador.
- **Dependencias transparentes:** cada release incluye un SBOM en formato CycloneDX.
- **Análisis local:** puedes escanear el instalador con Microsoft Defender antes de ejecutarlo.
- **Segunda opinión:** puedes subir el instalador público a [VirusTotal](https://www.virustotal.com/gui/home/upload) o buscar su SHA-256 en [VirusTotal Search](https://www.virustotal.com/gui/home/search).

La guía completa, con comandos copiables, está en [Cómo verificar una descarga](./docs/VERIFICAR.md).

> **Aviso de firma:** la aplicación todavía no está firmada con certificados comerciales de Microsoft y Apple. Windows SmartScreen puede mostrar “editor desconocido” y macOS Gatekeeper puede impedir la primera apertura. Estas advertencias no demuestran que exista malware, pero deben tomarse en serio: descarga únicamente desde Releases y realiza las verificaciones anteriores. El objetivo futuro es firmar y notarizar ambos instaladores.

## Idiomas

La interfaz incluye español, inglés, francés, portugués, italiano y alemán. En una instalación nueva toma el idioma del sistema si está disponible; después se puede cambiar en cualquier momento desde el selector de la barra superior. La preferencia queda guardada localmente.

## Sistemas compatibles

- **Windows 10/11 x64:** instalador `.exe`; abre Windows Terminal o PowerShell.
- **macOS Intel y Apple Silicon:** instalador universal `.dmg`; abre Terminal.

El código de la interfaz es común para ambos sistemas. La detección de comandos, las rutas y la apertura de la terminal se resuelven según el sistema operativo.

## Desarrollo

```shell
npm install
npm run dev
```

## Instalador

Descarga siempre la última versión desde [GitHub Releases](https://github.com/JotaEse68/jota-ai-launcher/releases/latest).

Windows:

```powershell
npm run dist:win
```

macOS:

```shell
npm run dist:mac
```

Los instaladores se generan en la carpeta `release/`. Las releases oficiales se compilan en runners independientes de Windows y macOS mediante GitHub Actions.

## Actualizaciones

El panel comprueba las versiones de los tres CLI y abre sus actualizadores oficiales en la terminal del sistema. El propio launcher busca actualizaciones publicadas en GitHub Releases.

## Fuentes oficiales

- Codex: https://developers.openai.com/codex/cli/
- Claude Code: https://code.claude.com/docs/en/setup
- OpenCode: https://opencode.ai/docs/
