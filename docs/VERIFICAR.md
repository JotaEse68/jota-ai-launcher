# Cómo verificar una descarga

Estas comprobaciones permiten saber si el instalador coincide con la release oficial y obtener una segunda opinión antivirus antes de ejecutarlo.

## 1. Descarga desde la fuente oficial

Usa únicamente [GitHub Releases](https://github.com/JotaEse68/jota-ai-launcher/releases/latest). Descarga el instalador `.exe` y `SHA256SUMS.txt` de la misma release.

## 2. Compara el SHA-256

Abre PowerShell en la carpeta de descargas:

```powershell
Get-FileHash -Algorithm SHA256 ".\Jota-AI-Launcher-Setup-0.1.0.exe"
Get-Content ".\SHA256SUMS.txt"
```

Los dos hashes deben ser idénticos. Si difieren, no ejecutes el archivo.

## 3. Verifica la procedencia de GitHub

Con [GitHub CLI](https://cli.github.com/) instalado:

```powershell
gh attestation verify ".\Jota-AI-Launcher-Setup-0.1.0.exe" --repo JotaEse68/jota-ai-launcher
```

Una verificación correcta vincula el archivo con el workflow y el commit públicos que lo generaron. La atestación prueba la procedencia; no sustituye una revisión de seguridad del código.

## 4. Analiza el instalador con Microsoft Defender

```powershell
Update-MpSignature
Start-MpScan -ScanType CustomScan -ScanPath (Resolve-Path ".\Jota-AI-Launcher-Setup-0.1.0.exe")
```

También puedes hacer clic derecho sobre el archivo y elegir **Analizar con Microsoft Defender**.

## 5. Obtén una segunda opinión

El instalador es público y puede enviarse a [VirusTotal Upload](https://www.virustotal.com/gui/home/upload). VirusTotal compara el archivo con múltiples motores de seguridad. También puedes pegar el SHA-256 en [VirusTotal Search](https://www.virustotal.com/gui/home/search) para comprobar si ya fue analizado.

VirusTotal comparte muestras con proveedores de seguridad; no subas allí archivos privados. El instalador oficial de este proyecto no contiene datos personales.

## 6. Revisa el código y la compilación

- Código fuente: [repositorio](https://github.com/JotaEse68/jota-ai-launcher)
- Pruebas públicas: [GitHub Actions](https://github.com/JotaEse68/jota-ai-launcher/actions)
- Dependencias: `package-lock.json` y el SBOM adjunto a cada release.

## Sobre SmartScreen

La versión inicial no tiene todavía un certificado comercial de firma de código. Windows puede mostrar **Editor desconocido**. Comprueba el origen, el hash, la atestación y el análisis antivirus antes de decidir si la ejecutas.
