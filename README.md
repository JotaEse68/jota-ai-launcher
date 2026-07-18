# Jota AI Launcher

Aplicación de escritorio para Windows que detecta, inicia y mantiene Codex, Claude Code y OpenCode desde una sola interfaz.

[![CI](https://github.com/JotaEse68/jota-ai-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/JotaEse68/jota-ai-launcher/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/JotaEse68/jota-ai-launcher?display_name=tag)](https://github.com/JotaEse68/jota-ai-launcher/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-2855d9.svg)](./LICENSE)

![Panel principal de Jota AI Launcher](./launcher-home.png)

## Privacidad

El instalador no contiene cuentas, contraseñas ni claves API. Cada CLI gestiona sus credenciales en el perfil del usuario de Windows. Para un ordenador compartido, se recomienda una cuenta de Windows por persona.

Consulta la [política de privacidad](./PRIVACY.md) para ver qué información lee el launcher y qué información no recopila.

## Seguridad y confianza

Jota AI Launcher es código abierto. No pedimos que confíes únicamente en una promesa: puedes revisar el código, comprobar de qué commit procede el instalador y analizarlo antes de abrirlo.

- **Compilación pública:** cada release se construye en GitHub Actions desde el código visible en este repositorio.
- **Procedencia verificable:** GitHub genera una atestación criptográfica que vincula el `.exe` con el workflow y el commit que lo produjeron.
- **Integridad:** cada release incluye `SHA256SUMS.txt` para detectar cualquier modificación del instalador.
- **Dependencias transparentes:** cada release incluye un SBOM en formato CycloneDX.
- **Análisis local:** puedes escanear el instalador con Microsoft Defender antes de ejecutarlo.
- **Segunda opinión:** puedes subir el instalador público a [VirusTotal](https://www.virustotal.com/gui/home/upload) o buscar su SHA-256 en [VirusTotal Search](https://www.virustotal.com/gui/home/search).

La guía completa, con comandos copiables, está en [Cómo verificar una descarga](./docs/VERIFICAR.md).

> **Aviso sobre SmartScreen:** la versión inicial todavía no está firmada con un certificado comercial de firma de código. Windows puede mostrar “editor desconocido”. Esa advertencia no demuestra que exista malware, pero debe tomarse en serio: descarga únicamente desde la sección oficial de Releases y realiza las verificaciones anteriores. El objetivo futuro es firmar el instalador cuando el proyecto disponga de certificado.

## Desarrollo

```powershell
npm install
npm run dev
```

## Instalador

Descarga siempre la última versión desde [GitHub Releases](https://github.com/JotaEse68/jota-ai-launcher/releases/latest).

```powershell
npm run dist:win
```

El instalador se genera en `release/Jota-AI-Launcher-Setup-0.1.0.exe`.

## Actualizaciones

El panel comprueba las versiones de los tres CLI y abre sus actualizadores oficiales en PowerShell. El propio launcher busca actualizaciones publicadas en GitHub Releases.

## Fuentes oficiales

- Codex: https://developers.openai.com/codex/cli/
- Claude Code: https://code.claude.com/docs/en/setup
- OpenCode: https://opencode.ai/docs/
