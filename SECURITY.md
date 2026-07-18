# Política de seguridad

## Versiones compatibles

La versión más reciente publicada en [GitHub Releases](https://github.com/JotaEse68/jota-ai-launcher/releases/latest) es la única que recibe correcciones de seguridad.

## Comunicar una vulnerabilidad

No publiques credenciales, tokens ni detalles explotables en un issue público. Utiliza [Report a vulnerability](https://github.com/JotaEse68/jota-ai-launcher/security/advisories/new) para enviar un aviso privado mediante GitHub Security Advisories.

Incluye una descripción del impacto, los pasos mínimos para reproducirlo y la versión afectada. Se confirmará la recepción y se coordinará la publicación de la corrección antes de revelar detalles sensibles.

## Modelo de confianza

- El renderer de Electron no tiene acceso directo a Node.js.
- La comunicación con el sistema usa una API limitada mediante `contextBridge`.
- Las acciones ejecutables están restringidas a comandos conocidos de los tres CLI.
- Los enlaces externos están limitados a dominios oficiales.
- El launcher no almacena credenciales ni claves API.
- Los binarios de release se acompañan de checksum, SBOM y atestación de procedencia.
