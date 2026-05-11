# curdeeclau-monorepo

Monorepo principal para mis proyectos desarrollados con Cursor, Claude Code, DeepClaude y herramientas relacionadas.

## Estructura

- `apps/`: aplicaciones (web, APIs, workers, etc.).
- `packages/`: librerías y módulos compartidos entre apps.
- `.cursor/rules/`: reglas de Cursor por capa (`project.mdc`, `frontend.mdc`, `backend.mdc`, `agents.mdc`, `tests.mdc`).
- `CLAUDE.md`: instrucciones para Claude Code / DeepClaude.

## Requisitos

- Node.js >= 20
- pnpm (idealmente 9.x)

## Primeros pasos

```bash
cd C:\Users\vonde\Proyectos\curdeeclau-monorepo
pnpm install
```

Después, las apps y paquetes se irán añadiendo en `apps/` y `packages/` con su propio package.json.
