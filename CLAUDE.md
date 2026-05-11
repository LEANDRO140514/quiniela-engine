# curdeeclau-monorepo

Monorepo principal (pnpm workspaces). Aquí vivirán apps y paquetes compartidos; la estructura exacta evolucionará con el tiempo.

## Para agentes (Claude Code / DeepClaude)

- **Contexto:** Trabaja solo en este repo. Antes de cambiar código que no conoces, revisa `README.md` (si existe), `package.json`, `CLAUDE.md` y `.cursor/rules/`.
- **Arquitectura:** No reorganices carpetas, capas ni límites entre `apps/` y `packages/` sin instrucción explícita del mantenedor. Extiende patrones ya presentes.
- **Contratos:** No inventes rutas de API, esquemas de base de datos, tipos compartidos, variables de entorno ni integraciones externas. Si falta información, pregunta qué archivo o fuente usar.
- **Cambios:** Prefiere cambios pequeños y revisables; no mezcles refactors grandes con features pequeñas.
- **TypeScript:** Prioriza TypeScript en código nuevo o sustancial; en zonas JS existentes, alinéate al estilo del repo salvo que pidan migración.
- **Reglas en Cursor:** Las reglas detalladas por capa están en `.cursor/rules/` (`project.mdc`, `frontend.mdc`, `backend.mdc`, `agents.mdc`, `tests.mdc`). Mantén coherencia con ellas cuando uses Cursor en paralelo.

## Notas sobre monorepo

- Raíz de workspace: esta carpeta.
- Workspace manager: pnpm.
- Workspaces planificados: `apps/*` (aplicaciones) y `packages/*` (librerías compartidas).
