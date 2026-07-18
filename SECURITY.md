# Política de seguridad

[Español](./SECURITY.md) · [English security review](./docs/SECURITY-REVIEW.en.md)

## Versiones compatibles

La versión más reciente publicada en [GitHub Releases](https://github.com/JotaEse68/jota-ai-launcher/releases/latest) es la única que recibe correcciones de seguridad.

## Comunicar una vulnerabilidad

No publiques credenciales, tokens ni detalles explotables en un issue público. Utiliza [Report a vulnerability](https://github.com/JotaEse68/jota-ai-launcher/security/advisories/new) para enviar un aviso privado mediante GitHub Security Advisories.

Incluye una descripción del impacto, los pasos mínimos para reproducirlo y la versión afectada. Se confirmará la recepción y se coordinará la publicación de la corrección antes de revelar detalles sensibles.

## Modelo de confianza

- El renderer de Electron no tiene acceso directo a Node.js.
- La comunicación con el sistema usa una API limitada mediante `contextBridge`.
- El proceso principal comprueba el origen de cada petición IPC y valida ajustes, rutas y acciones.
- Las rutas se autorizan mediante diálogos nativos, ajustes normalizados o escaneo controlado.
- Las acciones ejecutables están restringidas a comandos conocidos de los tres CLI.
- Los enlaces externos están limitados a dominios oficiales.
- Los permisos web, nuevas ventanas, navegación y `webview` están denegados.
- El launcher no almacena credenciales ni claves API.
- Los binarios de release se acompañan de checksum, SBOM y atestación de procedencia.
- CI ejecuta pruebas, auditoría completa de dependencias y análisis CodeQL con permisos mínimos.

Consulta el [informe técnico de la revisión de seguridad de la versión 0.4.0](./docs/SECURITY-REVIEW.md).

## Riesgos conocidos

- Los instaladores todavía no están firmados con certificados comerciales de Microsoft ni Apple. Verifica siempre el SHA-256 y la atestación de GitHub antes de ejecutarlos.
- Al iniciar un agente, ese CLI se ejecuta con los permisos de tu cuenta del sistema y puede acceder al proyecto seleccionado. Revisa sus propios permisos y confirmaciones.
- Toda dependencia de terceros supone riesgo de cadena de suministro. El proyecto reduce ese riesgo con lockfile, auditoría de npm, CodeQL, Dependabot, SBOM y acciones de GitHub fijadas por commit.
