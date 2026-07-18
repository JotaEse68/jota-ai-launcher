# Revisión de seguridad · Jota AI Launcher 0.3.1

[Español](./SECURITY-REVIEW.md) · [English](./SECURITY-REVIEW.en.md)

**Fecha:** 18 de julio de 2026

**Alcance:** código fuente, configuración de Electron, puente preload/IPC, rutas y comandos locales, dependencias, compilación y publicación.

**Método:** revisión estática manual, pruebas automatizadas, TypeScript estricto, auditoría de npm, búsqueda de secretos y análisis CodeQL en GitHub.

## Resultado ejecutivo

Tras aplicar las correcciones descritas abajo, no quedaron hallazgos críticos o altos conocidos en el alcance revisado. La aplicación mantiene una arquitectura local y de privilegio mínimo: el renderer está aislado y no puede decidir directamente qué rutas escanear ni qué carpeta recibe un comando.

Esta revisión aumenta la confianza, pero no certifica que el software sea invulnerable o esté libre de malware. Los instaladores continúan sin firma comercial, por lo que su procedencia debe verificarse con SHA-256 y la atestación de GitHub.

## Controles verificados

| Área | Control |
|---|---|
| Renderer | `nodeIntegration: false`, `contextIsolation: true`, sandbox y `webSecurity` activos |
| Navegación | nuevas ventanas, navegación, `webview` y permisos web denegados |
| CSP | scripts, imágenes, conexiones, formularios y objetos limitados explícitamente |
| IPC | solo acepta mensajes de la ventana principal; herramientas y acciones usan listas permitidas |
| Rutas | ajustes normalizados; carpetas aprobadas por diálogo nativo o escaneo desde raíces guardadas |
| Comandos | comandos internos fijos; la ruta del renderer no se interpola en el comando |
| Enlaces | solo HTTPS y dominios incluidos explícitamente |
| Credenciales | no existen formularios de claves API ni secretos incluidos en el paquete |
| Releases | checksums, SBOM CycloneDX y atestación de procedencia |
| CI | acciones fijadas por commit, permisos por trabajo, auditoría npm y CodeQL |

## Correcciones aplicadas

1. Se eliminó el control del renderer sobre las raíces de escaneo y la carpeta enviada al terminal.
2. Se añadió una lista de carpetas autorizadas y comprobación del emisor para todas las operaciones IPC.
3. Los ajustes persistidos se validan por tipo, idioma, existencia de directorio, duplicados y límite de raíces.
4. Se denegaron permisos web, navegación, ventanas emergentes y adjuntos `webview`; DevTools queda desactivado en paquetes publicados.
5. Se endureció la política CSP y se mantuvo una lista HTTPS para enlaces externos.
6. Se sustituyeron dependencias `latest` por rangos versionados y el lockfile sigue siendo la fuente reproducible.
7. GitHub Actions quedó fijado por SHA y con permisos mínimos por trabajo.
8. La auditoría cubre dependencias de producción y desarrollo, y se añadió análisis CodeQL semanal y en cada cambio.
9. Se añadió una prueba de regresión para descartar ajustes y rutas no confiables.

## Evidencia de validación

| Comprobación | Resultado el 18-07-2026 |
|---|---|
| `npm run build` | correcto, incluido TypeScript estricto y build de producción |
| `npm test` | 4 de 4 pruebas superadas |
| `npm audit --audit-level=high` | 0 vulnerabilidades conocidas |
| Búsqueda de patrones de credenciales | sin coincidencias |
| Validación de workflows YAML | 3 de 3 correctos |
| Microsoft Defender sobre el instalador local | no se encontraron amenazas |

CodeQL se ejecuta en GitHub sobre cada push y pull request; su estado público se muestra en el README. El instalador local y el generado por GitHub no son necesariamente idénticos, por lo que siempre debe verificarse el hash de la release descargada.

## Riesgos residuales

| Riesgo | Nivel | Tratamiento |
|---|---:|---|
| Instaladores sin firma comercial/notarización | Medio | descargar solo desde Releases y verificar hash + atestación; firma planificada |
| Dependencias npm y herramientas externas | Bajo–medio | lockfile, audit, Dependabot, SBOM y CodeQL |
| Acceso del CLI al proyecto seleccionado | Esperado | terminal visible y controles propios de cada agente |
| Metadatos locales de rutas/proyectos | Bajo | se almacenan localmente y no existe telemetría del launcher |

## Fuera de alcance

- La seguridad interna de Codex, Claude Code, OpenCode, npm o los modelos remotos.
- Extensiones, plugins o skills instalados por el usuario.
- Un sistema operativo o una cuenta de usuario ya comprometidos.
- Una auditoría externa independiente o una prueba de penetración certificada.

## Verificación recomendada

Antes de instalar una release, sigue [Cómo verificar una descarga](./VERIFICAR.md). Para comunicar una vulnerabilidad sin publicarla, utiliza [GitHub Security Advisories](https://github.com/JotaEse68/jota-ai-launcher/security/advisories/new).
