# 🎛️ CURDEECLAU MONOREPO — GENERAL RUNTIME STATE

## 🧠 LÍMITES DE MEMORIA DE CORTO PLAZO (AGENCY BUFFER)

- **Regla de Retención:** Operar bajo el modelo de optimización de contexto de 2 batches y 15 observaciones máximo.
- **Foco de Atención:** Priorizar el estado inmediato de los últimos commits de arquitectura distribuida y el inventario analizado de `openspec/`.

## 📖 GOBERNANZA OPENSPEC — CONSTITUCIÓN RT-1.5

- **Jerarquía de Autoridad:** Constitución RT-1.5 > OpenSpec Governance > Engine Specs > `shared/` > engines.
- **Cadena Algorithmus:** Blueprint → Pattern → Canonical Contracts → OpenSpec → Engine → Provider Adapter → Vertical.
- **Principios Core Obligatorios:**
  1. **Deterministic-first:** Las transiciones de estado se rigen por reglas. La IA enriquece contexto; nunca decide routing.
  2. **Provider-agnostic:** Plataformas externas (GHL, Chatwoot, WhatsApp, Google Calendar) son adapters, nunca el modelo de runtime.
  3. **Event-driven:** Cada mutación emite un `DomainEvent` canónico con `correlationId`, `causationId` y `actorId`.
  4. **Ownership-aware:** Todo engine respeta los modos `AI` / `HUMAN` / `SHARED` / `LOCKED`. Solo `handoff-engine` muta ownership.
  5. **Invariant-mandatory:** Toda spec define invariantes con `MUST` / `MUST NOT` verificables.
- **Restricciones Técnicas Transversales:**
  - Motores retornan `{ error, message }`; nunca lanzan excepciones.
  - IDs de provider en `metadata.providerId`; nunca como clave primaria canónica.
  - Comunicación cross-engine solo vía orchestrator + `DomainEvent`.
  - `shared/` no importa de engines, providers ni verticals.

## 🧱 INFRAESTRUCTURA ACTUAL

### Apps (Fase 1)

| App                             | Estado                                           |
| ------------------------------- | ------------------------------------------------ |
| `dental-ai-receptionist`        | Estable — Recepcionista dental con IA            |
| `landing_oraculo_society_forge` | En desarrollo — Template Forge (submódulo dirty) |
| `quiniela-2026_deepclaude`      | Estable — Control de predicciones Liga MX        |
| `reducidas-2026`                | Estable — Filtros matemáticos Progol/Revancha    |
| `survivor-world-cup`            | Estable — Survivor World Cup                     |

### Packages Core

| Package                         | Rol                                                                                     | Estado         |
| ------------------------------- | --------------------------------------------------------------------------------------- | -------------- |
| `shared/`                       | Contratos canónicos (DomainEvent, Ownership, ExecutionContext, CRM, Calendar, Workflow) | Activo         |
| `engines/calendar-engine`       | Coordinación temporal (reservas, disponibilidad, recordatorios)                         | Spec           |
| `engines/crm-engine`            | CRM provider-agnóstico                                                                  | Activo         |
| `engines/ghl-engine`            | CRM con adapter GHL                                                                     | Spec/Implement |
| `engines/handoff-engine`        | Ownership, supresión, recuperación AI↔Humano                                            | Activo         |
| `engines/media-delivery-engine` | Entrega de medios                                                                       | Activo         |
| `engines/message-buffer-engine` | Buffer de mensajes                                                                      | Activo         |
| `engines/workflow-orchestrator` | Orquestación central de workflows                                                       | Activo         |
| `knowledge-engine/`             | RAG, retrieval, memory windows, confidence scoring                                      | Design         |
| `algorithmus/`                  | Algoritmos y plataforma                                                                 | Activo         |
| `math-engine/`                  | Motor matemático (Python, fuera de pnpm workspace)                                      | Activo         |

### OpenSpec Change Proposals Activas

| Change                    | Fase OpenSpec    | Entidades Canónicas                                      | Invariantes |
| ------------------------- | ---------------- | -------------------------------------------------------- | ----------- |
| `create-ghl-engine`       | Spec / Implement | 4 (Contact, Opportunity, Pipeline, Campaign)             | 22          |
| `create-calendar-engine`  | Spec             | 4 (Calendar, TimeSlot, Reservation, Reminder)            | 30          |
| `create-knowledge-engine` | Design           | 6 (Source, Document, Chunk, Query, Result, MemoryWindow) | 25          |

## 🔴 DRIFT CATALOG — CONVERGENCIA PENDIENTE (RT-1.5)

Registro de divergencias entre la Constitución RT-1.5 y la implementación actual. Gobernanza manda; el código converge.

| ID        | Ubicación                                         | Divergencia                                                                                       | Severidad |
| --------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| **D-001** | `workflow-orchestrator/src/types.ts`              | Redefine `DomainEvent` sin `causationId`, `actorId`, `verticalId`, `workspaceId`, `metadata`      | Crítica   |
| **D-002** | `workflow-orchestrator/src/types.ts`              | Redefine `WorkflowContext`, `StepResult`, `StepStatus` en lugar de importar de `shared/`          | Crítica   |
| **D-003** | `workflow-orchestrator/src/events/DomainEvent.ts` | Event ID usa contador monotónico, no ULID/UUIDv7 (viola I-E6)                                     | Alta      |
| **D-004** | `handoff-engine/src/types.ts`                     | Define `HandoffDomainEvent` como universo paralelo de eventos sin extender `DomainEvent` canónico | Alta      |
| **D-005** | `ghl-engine/src/types.ts`                         | Exporta entidades con forma GHL (`GHLContact`, `GHLOpportunity`) sin mapeo canónico               | Alta      |
| **D-006** | `ghl-engine/`                                     | Sin adapter implementando `CRMProvider` interface de `crm-engine`                                 | Alta      |
| **D-007** | `crm-engine/src/types.ts`                         | Define `CRMEngineContext` divergente de `ExecutionContext` en `shared/`                           | Media     |
| **D-008** | `handoff-engine/`                                 | Sin carpeta OpenSpec (gobierna ownership/suppression/recovery — conceptos runtime críticos)       | Media     |
| **D-009** | `workflow-orchestrator/`                          | Sin carpeta OpenSpec                                                                              | Media     |
| **D-010** | `math-engine/`                                    | Proyecto Python fuera del workspace pnpm; sin integración con contratos `shared/`                 | Baja      |

## 🚀 HOJA DE RUTA Y ESCALABILIDAD FUTURA

- [ ] Resolver drift crítico D-001..D-006 para converger con RT-1.5.
- [ ] Completar ciclo OpenSpec de las 3 change proposals activas (Spec → Implement → Archive).
- [ ] Implementar adapters de infraestructura siguiendo el flujo: InMemory → Provider Adapter → Postgres.
- [ ] Refinar `EventCatalog` gobernado y capacidades del `WorkflowOrchestrator`.
- [ ] Desplegar interfaces PWA modulares adheridas a `runtime-semantics.md`.
- [ ] Integrar `math-engine` al workspace pnpm con contratos `shared/`.
- [ ] Nuevas apps/engines solo mediante OpenSpec proposal con invariantes verificables.

## 🛠️ PIPELINE DE VERIFICACIÓN GLOBAL

- **Entorno de Workspaces:** pnpm workspaces (Node >=20)
- **Comando de Validación Ecosistémica:** `pnpm build` desde raíz para validar tipos de exportaciones canónicas hacia todo el ecosistema.
