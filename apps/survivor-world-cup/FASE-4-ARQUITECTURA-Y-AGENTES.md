# FASE 4 · ARQUITECTURA TÉCNICA Y DISEÑO DE AGENTES

## Oraculo Survivor

**Estado del documento:** propuesta técnica integral para discusión con founder y equipo de producto/ingeniería.  
**Objetivo:** dejar una base suficientemente robusta para iniciar diseño detallado, tickets técnicos, modelado de datos e implementación por fases.  
**Principio rector:** arquitectura multi-tournament desde día 1, mobile-first, event-driven en los puntos críticos, pero sin sobrediseñar innecesariamente el MVP.

---

## 0. Resumen ejecutivo

Oraculo Survivor debe construirse como un **producto de competencia en tiempo real orientado a eventos** dentro de **Oraculo Society**, con un **núcleo transaccional fuerte** para picks, vidas, ventanas, pagos y ligas, y una **capa de inteligencia y mensajería desacoplada** que permita escalar durante picos del Mundial 2026 sin comprometer consistencia.

La recomendación principal es una arquitectura de **modular monolith + workers + event bus liviano**, desplegada sobre infraestructura administrada, con:

- **Frontend web mobile-first** en `React + TypeScript + Vite`, alineado al monorepo existente.
- **Backend principal** en `Node.js + TypeScript + Express`, alineado al stack existente en `packages/algorithmus`.
- **PostgreSQL** como sistema de verdad para estados de juego, pagos, ligas, picks y reglas versionadas.
- **Redis** para caching, locks distribuidos, rate limiting, colas y fan-out near-real-time.
- **BullMQ** para procesamiento asíncrono de cierres, resultados, notificaciones y refresh de ORÁCULO.
- **WebSocket/SSE gateway** para actualizaciones en vivo de countdowns, leaderboards y estados de ventana.
- **Stripe** como proveedor principal de pagos.
- **Telegram Bot API** como canal prioritario de notificaciones, complementado con push y email.

La decisión arquitectónica más importante es **no separar en microservicios independientes desde el día 1**, sino operar como una **plataforma única con bounded contexts claros**:

- **ATLAS**: game engine y source of truth del estado competitivo.
- **ORÁCULO**: motor probabilístico y capa de análisis.
- **HERMES**: reglas, estructura del torneo y OpenSpec.
- **IRIS**: mensajería, plantillas, scheduling y delivery multicanal.

Esta estructura permite escalar a **150K+ usuarios**, absorber cierres masivos de ventana y habilitar multi-tournament sin rehacer el core.

---

## 1. Principios de arquitectura

## 1.1 Principios no negociables

1. **PostgreSQL es la fuente de verdad del juego**  
   Picks, vidas, uso histórico de equipos, estado del torneo, pagos, membresías y ranking persistente deben vivir en una base transaccional fuerte.

2. **Las decisiones críticas deben ser idempotentes**  
   Registrar pick, cerrar ventana, aplicar resultado, descontar vida, activar premium o enviar notificación post-evento deben tolerar reintentos sin duplicar efectos.

3. **Multi-tournament no es opcional**  
   Toda entidad competitiva relevante debe estar scoped por `tournament_id`, y la mayoría por `tournament_id + season_instance_id` o equivalente versionado.

4. **Event-driven solo donde agrega valor**  
   El sistema no necesita una malla compleja de microservicios. Sí necesita eventos internos claros para desacoplar:
   - procesamiento de resultados,
   - recalculo de leaderboards,
   - notificaciones,
   - refresh de ORÁCULO,
   - auditoría.

5. **Picks y estados previos al cierre son datos sensibles**  
   Antes del lock de ventana, las selecciones del usuario deben estar protegidas a nivel de acceso, caché y observabilidad.

6. **Toda regla debe ser configurable**  
Oraculo Survivor 2026 es el launch event, pero el motor debe soportar variaciones futuras:
   - número de vidas,
   - definición de ventana,
   - política de repetición,
   - desempates,
   - fases del torneo,
   - estados excepcionales.

7. **Las operaciones de torneo deben ser auditables**  
   Cierres, correcciones de resultados, overrides manuales y recalculos deben dejar rastro técnico y funcional.

## 1.2 Principios de producto traducidos a arquitectura

- **Una sola gran decisión por ventana** → alta consistencia en el flujo de pick.
- **Telegram como extensión narrativa** → IRIS desacoplado del core, pero conectado a eventos del juego.
- **ORÁCULO transversal** → APIs de recomendación sidecar, nunca bloqueando el registro del pick.
- **Spectator Mode desde día 1** → el modelo debe distinguir claramente entre jugador activo, eliminado y espectador.
- **No pay-to-win** → pagos cambian acceso a features, no resultados del motor.

---

## 2. Arquitectura general del sistema

## 2.1 Vista de alto nivel

```text
                                      ┌──────────────────────────────┐
                                      │   Proveedores Externos       │
                                      │──────────────────────────────│
                                      │ Football Data / Odds APIs    │
                                      │ Telegram Bot API             │
                                      │ Stripe                       │
                                      │ Push Provider                │
                                      │ Email Provider               │
                                      │ Auth Provider                │
                                      └──────────────┬───────────────┘
                                                     │
                                                     ▼
┌────────────────────────────┐            ┌──────────────────────────────┐
│ Web App / PWA             │            │ Admin / Ops Console          │
│ React + TS + Vite         │◄──────────►│ Internal tooling             │
│ Mobile-first              │            │ overrides / support / audit  │
└──────────────┬─────────────┘            └──────────────┬───────────────┘
               │ HTTPS / WS / SSE                          │
               └──────────────────────┬────────────────────┘
                                      ▼
                         ┌──────────────────────────────┐
                         │ API Gateway / BFF            │
                         │ Express + TS                 │
                         │ auth, rate limit, routing    │
                         └───────┬───────────┬──────────┘
                                 │           │
             ┌───────────────────┘           └───────────────────────┐
             ▼                                                       ▼
┌──────────────────────────────┐                      ┌──────────────────────────────┐
│ Domain Core Services         │                      │ Realtime Gateway             │
│──────────────────────────────│                      │ WS / SSE fanout              │
│ ATLAS                        │                      │ leaderboard / countdowns     │
│ ORÁCULO                      │                      │ window state / result events │
│ HERMES                       │                      └─────────────┬────────────────┘
│ IRIS                         │                                    │
└──────────────┬───────────────┘                                    │
               │                                                    │
               ▼                                                    ▼
┌──────────────────────────────┐                      ┌──────────────────────────────┐
│ BullMQ Workers               │                      │ Redis                        │
│ cierre de ventana            │◄────────────────────►│ cache / locks / queues       │
│ ingestión de resultados      │                      │ rate limit / pub-sub         │
│ recálculo leaderboard        │                      └──────────────────────────────┘
│ scheduling mensajes          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ PostgreSQL                   │
│ source of truth transaccional│
│ users, picks, lives, leagues │
│ matches, windows, payments   │
│ audit, notifications         │
└──────────────────────────────┘
```

## 2.2 Estilo arquitectónico recomendado

### Recomendación principal

**Modular monolith con servicios lógicos por dominio** dentro del monorepo:

- `apps/oraculo-society-web`
- `packages/oraculo-survivor/atlas`
- `packages/oraculo-survivor/oraculo`
- `packages/oraculo-survivor/hermes`
- `packages/oraculo-survivor/iris`
- `packages/oraculo-survivor/shared`
- `packages/oraculo-survivor/contracts`

### Por qué no microservicios desde MVP

Aunque el producto tendrá picos fuertes, el perfil de complejidad real no justifica cuatro servicios totalmente aislados desde el día 1. Microservicios tempranos aumentarían:

- costo operativo,
- latencia entre componentes,
- complejidad de deploy,
- riesgo de inconsistencias entre ATLAS y ORÁCULO,
- sobrecarga de observabilidad.

Con 150K usuarios y picos concentrados en cierres de ventana, la carga es significativa pero totalmente manejable con:

- Postgres bien indexado,
- Redis para hot paths,
- colas para cómputos secundarios,
- horizontal scaling del API,
- workers desacoplados.

### Cuándo sí separar servicios físicos

La separación física se vuelve razonable cuando exista al menos una de estas condiciones:

1. IRIS tenga throughput multicanal muy superior al core.
2. ORÁCULO incorpore modelos y pipelines pesados con SLAs distintos.
3. Se operen múltiples torneos simultáneos y múltiples verticales deportivas.
4. El equipo requiera despliegues independientes por bounded context.

---

## 3. Stack tecnológico recomendado

## 3.1 Frontend

### Recomendación

- **React 19**
- **TypeScript**
- **Vite**
- **Zustand** para estado cliente
- **TanStack Query** para data fetching y cache de servidor
- **Tailwind CSS** para UI system
- **PWA capabilities** para mobile web installable

### Justificación

El monorepo ya muestra una base clara con `React + TypeScript + Vite + Zustand + Tailwind`, lo que reduce fricción y acelera consistencia entre apps. Para Oraculo Survivor, este stack es suficiente para:

- mobile-first rápido,
- deep links desde Telegram,
- rendering ágil,
- actualizaciones frecuentes vía polling/WS/SSE,
- share cards y UI social.

### Rechazo razonado

- **Next.js**: sería válido, pero no es necesario si el canal principal es app web transaccional más bot, y el monorepo ya está orientado a Vite.
- **React Native**: aumenta costo sin necesidad inmediata; el producto puede lanzar fuerte como PWA.

## 3.2 Backend API

### Recomendación

- **Node.js 20+**
- **TypeScript**
- **Express**
- **Zod** o validación equivalente para contracts
- **Pino** para logging estructurado
- **prom-client** para métricas
- **Sentry** para errores

### Justificación

El monorepo existente ya utiliza `Express`, `Pino`, `prom-client`, `BullMQ`, `Redis` y `PostgreSQL` en `packages/algorithmus`. Reusar ese stack:

- acelera bootstrap,
- mantiene consistencia de tooling,
- reduce curva de operación,
- facilita compartir prácticas internas de observabilidad y colas.

## 3.3 Base de datos

### Recomendación

- **PostgreSQL administrado** como primary database
- **Read replicas** para lecturas analíticas y dashboards pesados
- **Particionado lógico por torneo/temporada**, no por base separada al inicio

### Justificación

Oraculo Survivor necesita:

- integridad transaccional,
- constraints fuertes,
- joins claros entre entidades,
- versionado de reglas,
- historial auditable,
- pagos y premium con consistencia.

PostgreSQL es más adecuado que una base documental como primary store para el core del juego.

## 3.4 Realtime

### Recomendación

- **Redis Pub/Sub** o Streams para eventos internos livianos
- **SSE** para actualizaciones server-to-client masivas de leaderboard y countdown
- **WebSockets** para casos de interacción bidireccional puntual

### Justificación

La mayor parte del tiempo Oraculo Survivor necesita empujar:

- cierre de ventana,
- cambio de estado,
- actualización de leaderboard,
- resultado del pick,
- countdown.

Eso encaja muy bien con **SSE para fan-out simple y económico**, reservando WebSockets solo para necesidades más interactivas.

## 3.5 Auth

### Recomendación

- **Supabase Auth** o **Clerk** como proveedor de autenticación
- login con:
  - Google,
  - Apple,
  - Telegram,
  - email magic link

### Recomendación concreta

Si el equipo quiere máxima alineación con componentes existentes, **Supabase Auth** es una opción pragmática.  
Si se prioriza DX de auth y gestión social más sólida, **Clerk** puede ser superior.

### Decisión sugerida

**Supabase Auth para MVP**, con identidad interna persistida en PostgreSQL del dominio Oraculo Survivor.

### Justificación

- time-to-market alto,
- social login rápido,
- magic links resuelven fricción,
- no obliga a diseñar auth propio.

## 3.6 Payments

### Recomendación

- **Stripe** como proveedor principal

### Justificación

- excelente soporte para pagos internacionales,
- webhooks robustos,
- suscripciones y one-time payments,
- refunds,
- metadata útil para `tournament_pass`, `league_pro`, `creator_league`.

## 3.7 Messaging

### Recomendación

- **Telegram Bot API** como canal prioritario
- **Firebase Cloud Messaging** o equivalente para push web/mobile
- **Resend / Postmark** para email transaccional

### Justificación

Telegram ya es una pieza central del producto confirmado. El sistema debe soportar:

- mensajes transaccionales,
- digest narrativos,
- urgencia previa al cierre,
- notificaciones de eliminación,
- resúmenes por liga.

## 3.8 Queueing y jobs

### Recomendación

- **BullMQ + Redis**

### Justificación

Ya existe alineación con el monorepo. Es una opción sólida para:

- scheduling de mensajes,
- procesos de cierre,
- ingestión de resultados,
- refresh de probabilidades,
- recálculos de leaderboards.

---

## 4. Estrategia de hosting y deploy

## 4.1 Topología recomendada

### Opción recomendada

- **Frontend**: Vercel o Cloudflare Pages
- **API + workers**: Render, Railway, Fly.io o AWS ECS/Fargate
- **PostgreSQL**: Neon, Supabase Postgres, RDS o Cloud SQL
- **Redis**: Upstash Redis o Redis Cloud
- **Object storage**: S3-compatible para assets, exports y share cards

### Recomendación de equilibrio

Para MVP serio con aspiración global:

- **Frontend en Vercel**
- **API y workers en Fly.io o AWS ECS/Fargate**
- **Postgres administrado en RDS/Neon**
- **Redis Cloud**

## 4.2 Estrategia por entorno

- **dev**: entorno local con docker opcional para Postgres/Redis
- **staging**: stack casi idéntico a producción, con datos sandbox
- **prod**: infraestructura separada, secretos dedicados y observabilidad completa

## 4.3 Despliegue recomendado

- API stateless con horizontal scaling
- workers dedicados por tipo de carga:
  - `atlas-ops-worker`
  - `iris-dispatch-worker`
  - `oraculo-refresh-worker`
  - `leaderboard-worker`
- cron centralizado o scheduler administrado

---

## 5. Consideraciones de escala para el Mundial

## 5.1 Perfil de carga esperado

Picos importantes ocurrirán en:

1. **Últimos 60-10 minutos previos al cierre de ventana**
2. **Instante exacto de lock**
3. **Finalización de partidos decisivos**
4. **Publicación de recap/resultados**
5. **Inicio de fases nuevas**

## 5.2 Riesgos principales de escala

- avalancha de picks concurrentes cerca del cierre,
- fan-out masivo de notificaciones,
- recomputación de leaderboards muy frecuente,
- polling excesivo del frontend,
- latencia por locks de consistencia,
- dependencia excesiva de una API externa de resultados.

## 5.3 Estrategias de mitigación

### Cierres masivos de ventana

- hard close calculado en servidor, nunca en cliente
- countdown desde backend
- registro de pick con timestamp del servidor
- partición lógica por `tournament_id + window_id`
- endpoint de pick extremadamente acotado e idempotente
- cache de metadata de ventana y equipos ya usados

### Leaderboards

- no recalcular full ranking sin necesidad en tiempo real
- usar:
  - snapshot base,
  - incremental updates,
  - materialized views o tablas denormalizadas
- separar leaderboard global, de liga y país

### APIs externas

- ingestión propia y normalización interna
- cachear fixtures y odds
- tolerar retrasos y correcciones
- nunca depender en tiempo real del proveedor para responder un pick

### Notificaciones

- batching,
- colas priorizadas,
- deduplicación por plantilla + usuario + ventana,
- ventanas de silencio y preferencias.

---

## 6. Modelo de datos completo

## 6.1 Filosofía de modelado

El modelo recomendado es **relacional, fuertemente tipado y auditable**, con separación entre:

- entidades maestras,
- entidades operativas,
- snapshots/materializaciones,
- auditoría y eventos.

## 6.2 Entidades principales

### 6.2.1 Users

Tabla: `users`

Campos sugeridos:

- `id` UUID PK
- `auth_provider_user_id`
- `auth_provider`
- `telegram_user_id` nullable
- `email` nullable
- `display_name`
- `username` nullable
- `avatar_url` nullable
- `country_code`
- `language_code`
- `time_zone`
- `status` enum (`active`, `blocked`, `deleted`)
- `anti_abuse_score` numeric
- `premium_global_status` enum (`free`, `premium`, `grace`, `expired`)
- `preferences_json`
- `created_at`
- `updated_at`
- `last_seen_at`

Tablas auxiliares:

- `user_identities`
- `user_devices`
- `user_notification_preferences`
- `user_risk_flags`

### 6.2.2 Tournaments

Tabla: `tournaments`

Campos sugeridos:

- `id`
- `slug`
- `name`
- `sport`
- `edition`
- `host_country`
- `starts_at`
- `ends_at`
- `status` enum (`draft`, `scheduled`, `active`, `completed`, `archived`)
- `default_locale`
- `ruleset_version_id`
- `open_spec_version_id`
- `metadata_json`
- `created_at`
- `updated_at`

### 6.2.3 Tournament phases

Tabla: `tournament_phases`

- `id`
- `tournament_id`
- `phase_type` enum (`groups`, `round_of_32`, `round_of_16`, `quarterfinal`, `semifinal`, `third_place`, `final`)
- `name`
- `sequence`
- `starts_at`
- `ends_at`
- `status`

### 6.2.4 Rounds / Windows

Tabla: `tournament_windows`

- `id`
- `tournament_id`
- `phase_id`
- `window_number`
- `name`
- `window_type` enum (`matchday`, `phase_round`, `custom`)
- `starts_at`
- `lock_at`
- `ends_at`
- `status` enum (`scheduled`, `open`, `locked`, `in_progress`, `awaiting_results`, `settled`, `reopened`, `cancelled`)
- `eligible_match_count`
- `selection_rule_json`
- `settlement_version`
- `created_at`
- `updated_at`

### 6.2.5 Teams

Tabla: `teams`

- `id`
- `tournament_id`
- `external_provider_team_id`
- `fifa_code`
- `name`
- `short_name`
- `confederation`
- `group_code`
- `is_active`
- `logo_url`
- `strength_rating` nullable
- `metadata_json`

### 6.2.6 Matches

Tabla: `matches`

- `id`
- `tournament_id`
- `phase_id`
- `window_id`
- `external_provider_match_id`
- `home_team_id`
- `away_team_id`
- `venue`
- `starts_at`
- `status` enum (`scheduled`, `live`, `halftime`, `finished`, `cancelled`, `postponed`, `awarded`, `void`)
- `home_score`
- `away_score`
- `result_type` enum (`home_win`, `away_win`, `draw`, `void`, `pending`)
- `data_version`
- `provider_payload_json`
- `settled_at`
- `updated_at`

### 6.2.7 Tournament entries

Tabla: `tournament_entries`

Representa la inscripción de un usuario a un torneo concreto.

- `id`
- `tournament_id`
- `user_id`
- `entry_type` enum (`free`, `premium`, `sponsor`, `creator`, `admin_test`)
- `status` enum (`active`, `eliminated`, `spectator`, `withdrawn`, `banned`)
- `joined_at`
- `eliminated_at` nullable
- `spectator_since` nullable
- `current_lives`
- `max_lives`
- `used_teams_count`
- `last_settled_window_id`
- `last_pick_window_id`
- `country_code_snapshot`
- `premium_pass_id` nullable
- `eligibility_flags_json`

Constraint clave:

- unique (`tournament_id`, `user_id`)

### 6.2.8 Picks

Tabla: `picks`

- `id`
- `tournament_id`
- `window_id`
- `entry_id`
- `user_id`
- `selected_team_id`
- `selected_match_id` nullable
- `source` enum (`manual`, `telegram`, `auto`, `admin`)
- `status` enum (`draft`, `confirmed`, `locked`, `settled_win`, `settled_loss`, `settled_draw`, `void`, `reversed`)
- `submitted_at`
- `locked_at`
- `settled_at`
- `risk_snapshot_json`
- `oraculo_snapshot_id` nullable
- `client_context_json`
- `version`

Constraints:

- unique (`entry_id`, `window_id`)
- unique parcial por idempotency key si se usa

### 6.2.9 Used teams history

Tabla: `entry_used_teams`

- `id`
- `tournament_id`
- `entry_id`
- `team_id`
- `first_used_window_id`
- `pick_id`
- `created_at`

Constraint:

- unique (`entry_id`, `team_id`)

### 6.2.10 Lives history

Tabla: `life_events`

- `id`
- `tournament_id`
- `entry_id`
- `window_id`
- `pick_id` nullable
- `event_type` enum (`initial_grant`, `bonus_grant`, `life_lost`, `life_restored`, `manual_adjustment`, `final_elimination`)
- `delta`
- `balance_after`
- `reason_code`
- `reason_detail`
- `created_at`
- `created_by`

### 6.2.11 Leagues

Tabla: `leagues`

- `id`
- `tournament_id`
- `slug`
- `name`
- `league_type` enum (`private_basic`, `pro`, `creator`, `brand`, `global_country`, `system`)
- `owner_user_id`
- `visibility` enum (`private`, `link_only`, `public`)
- `join_code`
- `branding_json`
- `max_members`
- `status`
- `settings_json`
- `created_at`
- `updated_at`

Tabla: `league_members`

- `id`
- `league_id`
- `entry_id`
- `user_id`
- `role` enum (`owner`, `admin`, `member`)
- `joined_at`
- `status`

Constraint:

- unique (`league_id`, `entry_id`)

### 6.2.12 Leaderboards

Tabla materializada o denormalizada: `leaderboard_snapshots`

- `id`
- `tournament_id`
- `scope_type` enum (`global`, `league`, `country`)
- `scope_id` nullable
- `window_id`
- `snapshot_type` enum (`post_settlement`, `intraday`, `manual`)
- `generated_at`
- `version`

Tabla: `leaderboard_rows`

- `id`
- `snapshot_id`
- `entry_id`
- `user_id`
- `rank`
- `score`
- `lives_remaining`
- `survival_streak`
- `used_teams_count`
- `tiebreak_score`
- `country_code`
- `is_eliminated`

Para lecturas rápidas también puede existir:

Tabla: `leaderboard_current`

- `tournament_id`
- `scope_type`
- `scope_id`
- `entry_id`
- `rank`
- `score`
- `tiebreak_score`
- `updated_at`

### 6.2.13 Notifications

Tabla: `notification_templates`

- `id`
- `channel` enum (`telegram`, `push`, `email`)
- `template_key`
- `locale`
- `variant`
- `content_json`
- `status`
- `created_at`
- `updated_at`

Tabla: `notification_jobs`

- `id`
- `tournament_id`
- `entry_id` nullable
- `user_id`
- `channel`
- `template_key`
- `priority` enum (`low`, `normal`, `high`, `critical`)
- `scheduled_for`
- `status` enum (`queued`, `processing`, `sent`, `failed`, `cancelled`, `skipped`)
- `dedupe_key`
- `payload_json`
- `attempts`
- `provider_message_id` nullable
- `sent_at` nullable
- `created_at`

Tabla: `notification_deliveries`

- `id`
- `job_id`
- `channel`
- `provider_status`
- `provider_response_json`
- `delivered_at`
- `failed_at`

### 6.2.14 Payments

Tabla: `products`

- `id`
- `product_type` enum (`tournament_pass`, `league_pro`, `creator_league`, `brand_package`)
- `tournament_id` nullable
- `name`
- `price_amount`
- `currency`
- `billing_type` enum (`one_time`, `subscription`)
- `status`

Tabla: `payments`

- `id`
- `user_id`
- `tournament_id` nullable
- `product_id`
- `provider` enum (`stripe`, `polar`, `manual`)
- `provider_payment_intent_id`
- `provider_checkout_session_id`
- `status` enum (`created`, `pending`, `paid`, `failed`, `refunded`, `disputed`, `cancelled`)
- `amount`
- `currency`
- `country_code`
- `metadata_json`
- `paid_at`
- `created_at`

Tabla: `premium_entitlements`

- `id`
- `user_id`
- `tournament_id`
- `payment_id`
- `entitlement_type` enum (`premium_pass`, `league_admin`, `creator_tools`)
- `status` enum (`active`, `grace`, `expired`, `revoked`)
- `starts_at`
- `ends_at`
- `source`

### 6.2.15 Tournament rules and spec

Tabla: `rulesets`

- `id`
- `tournament_id`
- `version`
- `status`
- `rules_json`
- `created_at`
- `published_at`

Tabla: `open_specs`

- `id`
- `tournament_id`
- `version`
- `spec_json`
- `hash`
- `status`
- `created_at`

### 6.2.16 Audit and event log

Tabla: `domain_events`

- `id`
- `tournament_id` nullable
- `aggregate_type`
- `aggregate_id`
- `event_type`
- `event_version`
- `payload_json`
- `occurred_at`
- `correlation_id`
- `causation_id`

Tabla: `admin_audit_log`

- `id`
- `actor_user_id`
- `action`
- `target_type`
- `target_id`
- `reason`
- `before_json`
- `after_json`
- `created_at`

---

## 6.3 Relaciones entre entidades

```text
users 1───* tournament_entries *───1 tournaments
users 1───* payments
users 1───* premium_entitlements

tournaments 1───* tournament_phases
tournaments 1───* tournament_windows
tournaments 1───* teams
tournaments 1───* matches
tournaments 1───* leagues
tournaments 1───* rulesets
tournaments 1───* open_specs

tournament_windows 1───* matches
tournament_windows 1───* picks

tournament_entries 1───* picks
tournament_entries 1───* life_events
tournament_entries 1───* entry_used_teams
tournament_entries *───* leagues (via league_members)

matches *───1 teams (home)
matches *───1 teams (away)

leaderboard_snapshots 1───* leaderboard_rows
notification_jobs 1───* notification_deliveries
```

---

## 6.4 Índices recomendados

### Users

- `users(auth_provider, auth_provider_user_id)` unique
- `users(telegram_user_id)` unique nullable
- `users(email)` unique nullable
- `users(country_code)`
- `users(premium_global_status)`

### Tournament entries

- `tournament_entries(tournament_id, user_id)` unique
- `tournament_entries(tournament_id, status)`
- `tournament_entries(tournament_id, current_lives, status)`
- `tournament_entries(tournament_id, country_code_snapshot, status)`

### Windows

- `tournament_windows(tournament_id, status, lock_at)`
- `tournament_windows(tournament_id, window_number)` unique
- `tournament_windows(tournament_id, phase_id)`

### Matches

- `matches(tournament_id, window_id, status)`
- `matches(external_provider_match_id)` unique per provider
- `matches(tournament_id, starts_at)`
- `matches(tournament_id, status, updated_at)`

### Picks

- `picks(entry_id, window_id)` unique
- `picks(tournament_id, window_id, status)`
- `picks(tournament_id, user_id, window_id)`
- `picks(tournament_id, selected_team_id, window_id)`
- `picks(tournament_id, submitted_at)`

### Used teams

- `entry_used_teams(entry_id, team_id)` unique
- `entry_used_teams(tournament_id, team_id)`

### Life events

- `life_events(entry_id, created_at desc)`
- `life_events(tournament_id, window_id, event_type)`

### Leagues

- `leagues(tournament_id, slug)` unique
- `leagues(tournament_id, join_code)` unique
- `league_members(league_id, entry_id)` unique
- `league_members(entry_id)`

### Notifications

- `notification_jobs(status, scheduled_for)`
- `notification_jobs(user_id, channel, status)`
- `notification_jobs(dedupe_key)` unique parcial cuando aplique

### Payments

- `payments(provider, provider_payment_intent_id)` unique
- `payments(user_id, status, created_at desc)`
- `premium_entitlements(user_id, tournament_id, entitlement_type, status)`

### Leaderboards

- `leaderboard_current(tournament_id, scope_type, scope_id, rank)`
- `leaderboard_current(tournament_id, scope_type, scope_id, entry_id)` unique

---

## 6.5 Tiempo real vs batch

## 6.5.1 Datos tiempo real

Deben servirse casi en tiempo real:

- estado de ventana abierta/cerrada,
- countdown de cierre,
- pick confirmado del usuario,
- lives actuales,
- estado de eliminación,
- ranking top-N por scope,
- resultados de la jornada,
- badges básicos de actividad.

## 6.5.2 Datos batch o near-real-time

Pueden procesarse en cola:

- recap enriquecido,
- ranking completo global,
- analytics de ORÁCULO,
- estadísticas históricas,
- share cards complejas,
- segmentación de campañas.

## 6.5.3 Patrón recomendado

- **OLTP** en Postgres para verdad transaccional
- **Cache hot** en Redis para lecturas frecuentes
- **Tablas denormalizadas** para ranking actual
- **Jobs batch** para snapshots y exports

---

## 7. Diseño detallado de agentes

## 7.1 ATLAS — Motor del Juego

ATLAS es el **corazón operativo de Oraculo Survivor**. Debe ser el único componente autorizado a mutar:

- picks oficiales,
- uso de equipos,
- vidas,
- estado competitivo del entry,
- settlement de ventanas,
- leaderboard source.

### 7.1.1 Responsabilidades

- validar elegibilidad de picks
- bloquear ventanas
- fijar snapshots de picks
- resolver outcomes por ventana
- descontar o restaurar vidas
- determinar eliminación
- mantener estados de entrada
- producir eventos de dominio para IRIS, leaderboard y auditoría

### 7.1.2 State machine del torneo

```text
draft
  ↓ publish
scheduled
  ↓ tournament_start
active_pre_window
  ↓ window_open
window_open
  ↓ lock_time_reached
window_locked
  ↓ first_match_start / auto transition
window_in_progress
  ↓ all_eligible_matches_finished
awaiting_settlement
  ↓ settlement_complete
window_settled
  ↓ next_window_exists
active_pre_window
  ↓ no_next_window + tournament_complete
completed
  ↓ archive
archived
```

Estados excepcionales:

- `paused`
- `reopened`
- `under_review`

### 7.1.3 Lifecycle de una ventana de pick

#### Estado 1 · Scheduled

- HERMES ya definió fixtures elegibles.
- ORÁCULO puede precalcular análisis.
- IRIS puede preparar mensajes de apertura.

#### Estado 2 · Open

- usuario puede registrar o reemplazar pick hasta `lock_at`
- ATLAS valida:
  - usuario inscrito y activo
  - no eliminado
  - ventana abierta
  - equipo no repetido
  - equipo elegible
  - no hay conflicto con restricciones adicionales

#### Estado 3 · Locked

- se cierra escritura de picks
- picks pasan a snapshot oficial
- IRIS envía “pick locked”
- ORÁCULO cambia modo de lectura post-lock

#### Estado 4 · In Progress

- ya no se acepta ninguna mutación salvo overrides administrativos auditados
- ATLAS monitorea resultados entrantes

#### Estado 5 · Awaiting Settlement

- todos los partidos relevantes terminaron o existe criterio de finalización
- se consolida el outcome

#### Estado 6 · Settled

- se clasifican picks como:
  - `settled_win`
  - `settled_loss`
  - `settled_draw`
  - `void`
- se emiten `life_events`
- se actualiza `tournament_entries`
- se recalculan leaderboards
- IRIS dispara recap

### 7.1.4 Validación de picks

Reglas mínimas:

1. `entry.status = active`
2. `window.status = open`
3. `server_now < window.lock_at`
4. `selected_team_id` pertenece al torneo
5. equipo no existe en `entry_used_teams`
6. equipo tiene al menos un partido elegible en la ventana
7. no existe pick confirmado previo para otro torneo/entry incompatible
8. request firmada/autenticada

### 7.1.5 Motor de scoring y desempates

Oraculo Survivor no es un fantasy de puntos altos, pero sí necesita un esquema consistente para ranking.

#### Score base recomendado

- supervivencia de ventana: `+100`
- pick ganado con equipo no favorito: `+bonus configurable`
- pick temprano confirmado: **no dar ventaja**
- premium: **sin ventaja de score**

#### Variables de ranking

Orden recomendado:

1. `is_alive desc`
2. `lives_remaining desc`
3. `windows_survived desc`
4. `used_teams_count asc` o `strength_consumed asc` según regla
5. `tiebreak_score desc`
6. `pick_submitted_at asc` solo si reglamento lo permite
7. `randomized stable fallback` auditado como último recurso

#### Recomendación práctica

Separar:

- **survival status** como criterio primario
- **ranking score** como criterio secundario
- **tiebreak fields** explícitos y visibles en HERMES

### 7.1.6 Sistema de vidas

#### Configuración Survivor 2+1

- vidas iniciales efectivas: `3`
- origen recomendado:
  - `2 base`
  - `1 bonus launch`

#### Reglas base

- si el pick gana → no pierde vida
- si empata o pierde → `delta = -1`
- si llega a `0` → estado `eliminated`, luego `spectator`

#### Bonus y ajustes

El sistema debe soportar por configuración:

- vida bonus inicial
- vida bonus promocional global
- vida restaurada excepcional por decisión operativa
- vida no descontada ante `void result`

#### Trazabilidad

Cada cambio de vida debe escribir `life_events`.

### 7.1.7 Leaderboard engine

ATLAS calcula el resultado base; un worker especializado materializa ranking.

Scopes mínimos:

- global tournament
- league
- country

Estrategia:

1. settlement produce eventos `entry_settled`
2. worker actualiza `leaderboard_current`
3. snapshots se generan post-window
4. top-N se cachea en Redis

### 7.1.8 Procesamiento de resultados

#### Flujo

1. proveedor externo envía/expone actualización
2. ingest worker normaliza resultado
3. `matches` se actualiza con `data_version`
4. cuando todos los partidos relevantes de una ventana cumplen condición final:
   - ATLAS ejecuta settlement
5. por cada pick:
   - identifica outcome
   - crea evento de vida
   - actualiza estado del entry
6. emite eventos:
   - `window_settled`
   - `entry_eliminated`
   - `leaderboard_recalc_requested`
   - `notification_requested`

### 7.1.9 APIs expuestas por ATLAS

#### Públicas para app

- `GET /tournaments/:slug/status`
- `GET /tournaments/:slug/windows/current`
- `GET /tournaments/:slug/entries/me`
- `GET /tournaments/:slug/picks/me`
- `POST /tournaments/:slug/windows/:windowId/picks`
- `PUT /tournaments/:slug/windows/:windowId/picks`
- `GET /tournaments/:slug/leaderboard`
- `GET /leagues/:leagueId/leaderboard`

#### Internas / administrativas

- `POST /internal/atlas/windows/:windowId/open`
- `POST /internal/atlas/windows/:windowId/lock`
- `POST /internal/atlas/windows/:windowId/settle`
- `POST /internal/atlas/matches/:matchId/reconcile`
- `POST /internal/atlas/entries/:entryId/manual-adjustment`

### 7.1.10 Cron jobs / scheduled tasks

- apertura automática de ventana
- pre-lock health check
- lock automático de ventana
- verificación de resultados incompletos
- settlement retry
- snapshot de leaderboard
- transición a spectator mode
- cierre de torneo

---

## 7.2 ORÁCULO — Inteligencia Probabilística

ORÁCULO no controla el juego; **asiste la decisión**. Su arquitectura debe ser robusta, pero jamás bloquear el core de ATLAS.

### 7.2.1 Responsabilidades

- consolidar datos de fútbol y odds
- generar probabilidades implícitas y ajustadas
- calcular riesgo relativo por pick
- producir recomendaciones por ventana
- diferenciar producto free vs premium
- aplicar disclaimer obligatorio

### 7.2.2 Fuentes de datos recomendadas

#### Primarias

- **API-Football** para fixtures y resultados si se busca costo/rapidez
- **SportRadar** si se prioriza robustez enterprise
- **Odds API / bookmaker feeds** para convertir cuotas a probabilidades

#### Secundarias

- ratings propios
- historial reciente
- Elo/FIFA rating
- disponibilidad de jugadores si se desea enriquecer después

### 7.2.3 Pipeline de análisis por ventana

```text
Ingesta fixtures + odds + ratings
        ↓
Normalización por partido
        ↓
Cálculo de probabilidad win/draw/loss
        ↓
Ajustes por contexto de torneo
        ↓
Cálculo de risk score / confidence / volatility
        ↓
Generación de ranking de picks elegibles
        ↓
Persistencia de snapshots por window
        ↓
Publicación a API y cache
```

### 7.2.4 Modelo de riesgo/confianza/volatilidad

#### Variables base

- `win_probability`
- `draw_probability`
- `loss_probability`
- `market_consensus_strength`
- `team_strength_gap`
- `phase_pressure_factor`
- `upset_potential`
- `selection_scarcity` del usuario

#### Campos propuestos

- `confidence_score` de 0 a 100
- `risk_score` de 0 a 100
- `volatility_score` de 0 a 100
- `reserve_value_score` para indicar costo estratégico de “quemar” un favorito
- `oraculo_tier` (`basic`, `advanced`)

#### Interpretación

- **Confidence**: probabilidad de supervivencia inmediata
- **Risk**: chance combinada de resultado adverso + costo estratégico
- **Volatility**: dispersión/incertidumbre de la lectura

### 7.2.5 Diferenciación free vs premium

#### Free

- top picks básicos
- probabilidad resumida
- semáforo de riesgo simple
- texto corto de contexto
- disclaimer siempre visible

#### Premium

- ranking extendido de picks
- planner multi-ventana
- costo de oportunidad de usar una selección ahora
- escenarios de bracket
- comparativo entre picks
- insights por liga/rivales
- picks contrarian con racional cuantitativo

### 7.2.6 Disclaimer engine

ORÁCULO debe tener un submódulo explícito de compliance narrativo.

Reglas:

- toda recomendación debe incluir un disclaimer contextual
- no usar lenguaje de certeza
- no prometer ganancias
- no presentarse como consejo financiero/apuesta garantizada

Ejemplos de salida:

- “Análisis probabilístico, no garantía de resultado.”
- “Mayor probabilidad no implica certeza.”
- “Usa esta información como apoyo estratégico, no como promesa.”

### 7.2.7 Cache y refresh strategy

Hot cache por:

- `tournament_id + window_id + team_id`
- `tournament_id + entry_id + window_id + tier`

Política recomendada:

- fixtures y datos estáticos: TTL largo
- odds y probabilidad: refresh cada 5-15 min pre-window
- última hora antes del cierre: refresh más frecuente para premium
- post-lock: congelar snapshot para consistencia histórica

### 7.2.8 APIs expuestas por ORÁCULO

- `GET /tournaments/:slug/oraculo/windows/:windowId/overview`
- `GET /tournaments/:slug/oraculo/windows/:windowId/picks`
- `GET /tournaments/:slug/oraculo/windows/:windowId/picks/:teamId`
- `GET /tournaments/:slug/oraculo/planner`
- `GET /tournaments/:slug/oraculo/disclaimer`

### 7.2.9 Reglas operativas importantes

- ORÁCULO puede fallar degradando a caché, pero ATLAS debe seguir aceptando picks.
- si no hay datos frescos, mostrar `stale_at` visible al usuario premium.
- guardar snapshot de análisis vinculado al pick si el usuario consultó antes de confirmar.

---

## 7.3 HERMES — Documentación y Reglas

HERMES es el **sistema normativo y estructural**. Debe evitar que las reglas existan “hardcodeadas” en múltiples lugares.

### 7.3.1 Responsabilidades

- modelar estructura oficial del torneo
- mapear calendario real a ventanas de juego
- publicar OpenSpec
- versionar reglas
- exponer documentación legible por humanos y sistemas

### 7.3.2 Configuración del torneo

HERMES debe administrar:

- equipos participantes
- fases
- partidos
- definición de ventanas
- elegibilidad de picks por ventana
- criterios de settlement
- desempates
- excepciones

### 7.3.3 OpenSpec

Formato recomendado: **JSON versionado**, con representación exportable a Markdown.

Ejemplo conceptual:

```json
{
  "tournament": {
    "slug": "world-cup-2026",
    "edition": 2026,
    "sport": "football"
  },
  "ruleset": {
    "version": "1.0.0",
    "lives": {
      "base": 2,
      "bonus": 1
    },
    "pick_policy": {
      "per_window": 1,
      "repeat_team": false
    },
    "window_policy": {
      "max_windows": 8,
      "lock_rule": "before_first_match"
    },
    "settlement_policy": {
      "win": "survive",
      "draw": "lose_life",
      "loss": "lose_life",
      "void": "no_penalty"
    }
  }
}
```

### 7.3.4 Calendario engine

Debe resolver:

- mapping de partidos reales a ventana Survivor
- transición grupos → eliminatorias
- definición de ventanas con múltiples partidos simultáneos
- ventanas especiales si FIFA reprograma

#### Regla base Survivor 2026

“El pick cierra antes del primer partido de la jornada.”

Eso implica que HERMES debe producir, por ventana:

- hora oficial de apertura
- hora oficial de lock
- lista oficial de partidos elegibles
- zona horaria canonical

### 7.3.5 Reglas como configuración

Toda regla debe estar parametrizada:

- `lives.base`
- `lives.bonus`
- `pick.reuse_allowed`
- `window.max_count`
- `window.lock_strategy`
- `settlement.draw_penalty`
- `tie_breakers[]`
- `reopen_policy`
- `void_match_policy`

### 7.3.6 APIs expuestas por HERMES

- `GET /tournaments/:slug/spec`
- `GET /tournaments/:slug/rules`
- `GET /tournaments/:slug/windows`
- `GET /tournaments/:slug/matches`
- `GET /tournaments/:slug/teams`
- `GET /tournaments/:slug/phases`

### 7.3.7 Consideración crítica

HERMES debe poder congelar una versión oficial publicada de reglas y OpenSpec por torneo, para que:

- ATLAS liquide consistentemente,
- soporte pueda justificar decisiones,
- producto pueda comunicar reglas exactas,
- auditoría tenga trazabilidad.

---

## 7.4 IRIS — Mensajería y Notificaciones

IRIS es la **capa narrativa y operativa de comunicación**. No es un bot “chatty” genérico; es un sistema de engagement transaccional, emocional y contextual.

### 7.4.1 Responsabilidades

- Telegram bot
- scheduling de mensajes por eventos y cron
- push notifications
- email transaccional
- plantillas por idioma, estado y urgencia
- rate limiting y preferencias

### 7.4.2 Arquitectura del bot de Telegram

Componentes:

- webhook receiver
- command router
- user linker
- template renderer
- outbound dispatcher
- delivery tracker

Flujo:

1. usuario vincula Telegram
2. IRIS resuelve `telegram_user_id -> user_id`
3. eventos de ATLAS/ORÁCULO disparan jobs
4. IRIS renderiza mensaje y lo envía
5. guarda delivery status

### 7.4.3 Sistema de templates

Dimensiones:

- canal
- idioma
- estado del jugador
- tipo de ventana
- urgencia
- tier

Ejemplos de `template_key`:

- `window_open`
- `window_closing_24h`
- `window_closing_1h`
- `pick_confirmed`
- `pick_locked`
- `result_survived`
- `result_lost_life`
- `result_eliminated`
- `new_phase_started`
- `premium_activated`

### 7.4.4 Scheduling engine

Triggers:

- por tiempo:
  - `24h before lock`
  - `6h before lock`
  - `1h before lock`
  - `15m before lock`
- por evento:
  - pick confirmado
  - pick faltante
  - ventana cerrada
  - resultado liquidado
  - eliminación
  - premium activado

Escalamiento de urgencia:

- normal → reminder amable
- high → recordatorio con countdown
- critical → última llamada si no ha hecho pick

### 7.4.5 Queue de mensajes

Colas recomendadas:

- `iris-telegram-high`
- `iris-telegram-normal`
- `iris-push`
- `iris-email`
- `iris-digest`

Cada job debe incluir:

- `user_id`
- `entry_id`
- `channel`
- `template_key`
- `scheduled_for`
- `dedupe_key`
- `priority`

### 7.4.6 Personalización por estado del jugador

#### Jugador con 3 vidas

- tono más aspiracional
- foco en estrategia

#### Jugador con 1 vida

- tono de urgencia alta
- recordatorios más agresivos, respetando preferencias

#### Eliminado

- activar Spectator Mode
- mensajes de seguimiento más espaciados
- foco en liga, share, recap y próxima competencia

### 7.4.7 Rate limiting y preferencias

IRIS debe respetar:

- opt-in por canal
- quiet hours por zona horaria
- frecuencia máxima por día
- deduplicación por evento
- exclusión si ya hizo pick y no requiere recordatorio

### 7.4.8 Canales

#### Telegram

Canal principal de narrativa.

#### Push

Muy útil para:

- cierre inminente,
- pick confirmado,
- resultado listo.

#### Email

Para:

- premium receipt,
- resumen semanal,
- onboarding,
- soporte.

### 7.4.9 APIs expuestas por IRIS

- `POST /internal/iris/dispatch`
- `POST /internal/iris/schedule`
- `GET /users/me/notification-preferences`
- `PUT /users/me/notification-preferences`
- `POST /telegram/webhook`

---

## 8. Flujos críticos del sistema

## 8.1 Flujo completo de un pick

```text
1. Usuario abre app
2. Frontend consulta:
   - estado de torneo
   - ventana actual
   - entry actual
   - equipos disponibles
3. Usuario consulta ORÁCULO
4. ORÁCULO responde análisis + disclaimer
5. Usuario selecciona equipo
6. Frontend envía POST /picks con idempotency key
7. ATLAS valida:
   - auth
   - entry activa
   - ventana abierta
   - equipo no repetido
   - equipo elegible
8. ATLAS persiste pick confirmado
9. ATLAS emite event `pick_confirmed`
10. IRIS consume evento y manda confirmación por Telegram/push
11. Frontend actualiza UI a estado `pick locked/pending lock`
```

Puntos de control:

- si ORÁCULO cae, el paso 3 puede degradarse a caché
- si IRIS falla, el pick sigue válido
- si el usuario reintenta submit, la idempotency key evita duplicados

## 8.2 Flujo de cierre de ventana

```text
1. Cron/scheduler detecta lock_at
2. ATLAS ejecuta transición open -> locked
3. Se bloquean escrituras de picks
4. Se emite snapshot oficial de picks por window
5. IRIS envía “ventana cerrada”
6. Matches se desarrollan
7. Ingest worker recibe resultados
8. ATLAS detecta que la ventana está lista para liquidar
9. Ejecuta settlement por entry
10. Actualiza vidas y estados
11. Dispara recálculo de leaderboard
12. IRIS notifica resultados
13. Se abre siguiente ventana o se marca nueva fase
```

## 8.3 Flujo de eliminación

```text
1. Settlement genera life_event con balance_after = 0
2. ATLAS cambia entry.status a eliminated
3. Registra eliminated_at
4. Genera transición a spectator elegible
5. Emite event `entry_eliminated`
6. IRIS envía notificación de eliminación
7. Frontend muestra experiencia Spectator Mode
8. Leaderboard marca usuario como eliminado
```

## 8.4 Flujo de inicio de nueva fase

```text
1. HERMES detecta/activa nueva phase
2. Publica windows y fixtures de la fase siguiente
3. ORÁCULO precalcula análisis
4. ATLAS crea contexto operativo de nueva ventana
5. IRIS comunica transición:
   “empieza nueva fase”
6. Frontend actualiza navegación, countdown y elegibilidad
```

## 8.5 Flujo de pago premium

```text
1. Usuario elige Premium Tournament Pass
2. Frontend crea checkout session
3. Stripe procesa pago
4. Webhook de Stripe confirma `paid`
5. Payments service persiste transacción
6. Se crea premium_entitlement activo
7. User premium status se actualiza
8. IRIS envía confirmación
9. Frontend desbloquea ORÁCULO premium y features premium
```

Regla crítica:

- el unlock premium debe basarse en webhook confirmado, no solo en redirect del cliente

---

## 9. Seguridad y edge cases

## 9.1 Anti multi-accounting

Oraculo Survivor no necesita un sistema policial excesivo, pero sí un framework anti-abuse razonable.

Señales sugeridas:

- dispositivo compartido
- fingerprint suave
- IPs anómalas
- múltiples cuentas vinculadas al mismo Telegram
- patrones de creación masiva
- métodos de pago repetidos
- referidos en clusters sospechosos

Controles:

- score de riesgo por usuario
- límites de creación por IP/dispositivo
- challenge adicional en casos sospechosos
- revisión manual para ligas pro/premios

## 9.2 Rate limiting

Aplicar rate limiting por:

- login
- endpoint de picks
- endpoints de ORÁCULO
- webhook de Telegram
- checkout creation

Estrategia:

- Redis-backed sliding window
- límites más estrictos en endpoints públicos
- bypass controlado para workers internos

## 9.3 Validación de picks

Casos a invalidar:

- ventana cerrada
- equipo repetido
- equipo sin partido elegible
- usuario eliminado
- torneo equivocado
- payload manipulado

## 9.4 Partidos suspendidos/cancelados

HERMES y ATLAS deben soportar `void policy`.

Opciones configurables:

- pick queda void sin penalización
- se reabre ventana si el partido era único soporte del pick
- settlement se retrasa hasta decisión oficial

### Recomendación para MVP

- `cancelled/postponed before play` → pick `void`
- `awarded/officially decided` → usar resultado oficial si reglamento lo permite
- toda excepción debe estar en OpenSpec

## 9.5 Rollback de resultados

Caso: proveedor corrige marcador después de settlement.

Patrón recomendado:

1. marcar match con `data_version++`
2. detectar impacto
3. crear `reconciliation job`
4. revertir settlement afectado con eventos compensatorios
5. regenerar leaderboard
6. IRIS envía comunicación si el cambio afecta al usuario

Nunca hacer updates silenciosos sin rastro.

## 9.6 Protección de picks antes del cierre

Medidas:

- API solo devuelve pick propio
- no exponer picks ajenos pre-lock
- cifrado a nivel aplicación no es obligatorio, pero sí control de acceso estricto
- logs sin payload sensible de picks
- cache segmentado por usuario
- dashboards de admin con acceso limitado

## 9.7 Idempotencia y concurrencia

Casos críticos:

- doble click en confirmar pick
- retry de webhook Stripe
- retry de Telegram
- cron duplicado de settlement

Soluciones:

- `idempotency_key`
- locks Redis por `window_id`
- unique constraints
- state transition guards

---

## 10. Infraestructura y DevOps

## 10.1 Estrategia de ambientes

### Dev

- Postgres local o remoto sandbox
- Redis local
- mocks parciales de proveedores

### Staging

- entorno product-like
- fixtures de torneo sandbox
- bot Telegram de staging
- Stripe test mode

### Prod

- aislamiento total
- secretos rotados
- backups automáticos
- replicas de lectura si el tráfico lo exige

## 10.2 CI/CD pipeline

Pipeline recomendado:

1. install
2. lint
3. typecheck
4. unit tests
5. integration tests críticos
6. build artifacts
7. deploy staging
8. smoke tests
9. manual approval para prod
10. deploy prod

Checks mínimos por dominio:

- contracts y schemas
- reglas de migrations
- tests de ATLAS settlement
- tests de ORÁCULO transformation
- tests de IRIS template rendering

## 10.3 Monitoring y alertas

Métricas clave:

- latency p95/p99 por endpoint
- error rate por servicio
- picks por minuto
- picks fallidos por minuto
- queue lag BullMQ
- settlement duration
- webhook failures
- Telegram send failure rate
- Stripe webhook processing lag
- cache hit rate ORÁCULO

Alertas prioritarias:

- lock de ventana no ejecutado
- settlement atrasado
- mismatch entre picks y entries
- caída de proveedor de resultados
- spike de errores 5xx
- backlog crítico en colas

## 10.4 Estrategia de logs

Logging estructurado con:

- `request_id`
- `correlation_id`
- `user_id` cuando aplique
- `entry_id`
- `tournament_id`
- `window_id`
- `event_type`

Política:

- no loggear picks ajenos completos pre-lock
- mascarar PII sensible
- separar logs de auditoría de logs operativos

## 10.5 Plan de escalamiento para picos

### Horizontal

- múltiples réplicas del API
- workers escalables por cola
- realtime gateway independiente si hace falta

### Vertical temporal

- incrementar recursos de DB y Redis en semanas pico

### Operativo

- freeze de deploys en ventanas críticas
- on-call reforzado durante cierres y knockout rounds
- runbooks de:
  - provider outage
  - payment lag
  - delayed settlement
  - reconciliation

---

## 11. Integraciones externas

## 11.1 API de resultados de fútbol

### Recomendación primaria

- **SportRadar** si hay presupuesto enterprise y necesidad de alta robustez

### Recomendación pragmática MVP

- **API-Football** como punto de arranque rápido

### Estrategia recomendada

- encapsular proveedor detrás de un adapter interno
- nunca acoplar ATLAS directamente al schema del proveedor
- almacenar payload bruto + modelo normalizado

## 11.2 Telegram Bot API

Uso:

- linking de cuenta
- reminders
- confirmaciones
- recap y eliminación

Necesidades:

- webhook receiver
- verificación de origen
- retry controlado

## 11.3 Payment provider

### Recomendación

- **Stripe** sobre Polar para el caso central

Razones:

- cobertura,
- madurez,
- webhooks,
- Checkout rápido,
- metadata y refunds.

## 11.4 Auth provider

### Recomendación MVP

- **Supabase Auth**

Razones:

- rapidez,
- social auth,
- magic links,
- alineación probable con ecosistema existente.

## 11.5 Push notifications

### Recomendación

- **Firebase Cloud Messaging**

Para:

- web push,
- Android,
- futura app móvil si aparece.

## 11.6 Email transaccional

### Recomendación

- **Postmark** o **Resend**

Prioridad:

- confiabilidad,
- plantillas simples,
- buena DX.

---

## 12. Propuesta de estructura del monorepo para Oraculo Society / Oraculo Survivor

```text
apps/
  oraculo-society-web/
  oraculo-society-admin/
  survivor-world-cup/
    FASE-1-CONCEPTO-Y-REGLAS.md
    FASE-2-MODELO-NEGOCIO-Y-POSICIONAMIENTO.md
    FASE-3-UX-Y-TELEGRAM-FLOWS.md
    FASE-4-ARQUITECTURA-Y-AGENTES.md

packages/
  oraculo-survivor/
    contracts/
    shared/
    atlas/
    oraculo/
    hermes/
    iris/
    db/
    realtime/
```

### Responsabilidad por package

- `contracts`: DTOs, schemas, enums, event contracts
- `shared`: utilidades cross-domain
- `atlas`: game engine
- `oraculo`: models y recommendation service
- `hermes`: spec, rules, schedule engine
- `iris`: bot, templates, queue dispatch
- `db`: migraciones, repositories, views
- `realtime`: SSE/WS gateway

---

## 13. Recomendación de roadmap técnico

## Fase A · Foundations

- bootstrap de frontend y API
- auth
- modelo base de torneo, ventana, equipo, partido
- ATLAS mínimo para pick/lock/settlement

## Fase B · Competitive core

- vidas
- entries
- used teams
- leaderboard global/league
- Spectator Mode

## Fase C · ORÁCULO + IRIS

- ingest de datos
- análisis básico
- Telegram bot
- reminders y recap

## Fase D · Premium + leagues

- Stripe
- entitlements
- ligas pro/creator
- ORÁCULO premium

## Fase E · Scale hardening

- reconciliation
- admin console
- observabilidad completa
- runbooks de torneo en vivo

---

## 14. Decisiones técnicas del founder (cerradas)

1. **Modular monolith ahora, microservicios después** → **Confirmado.** Microservicios solo cuando la escala lo justifique.
2. **PWA primero, app nativa después** → **Confirmado.** Nativa solo si hay tracción.
3. **Supabase Auth para MVP** → **Confirmado.** Alineado con PostgreSQL como source of truth.
4. **API de partidos abstraída** → **Confirmado.** Empezar barato; SportRadar después si escala.
5. **SSE como realtime principal** → **Confirmado.** Suficiente para rankings, picks y estados.
6. **PostgreSQL source of truth único del juego** → **Confirmado.** Mejor que Firebase para lógica competitiva, pagos y auditoría.
7. **ORÁCULO desacoplado de ATLAS, pero no servicio separado aún** → **Confirmado.** Módulo separado, no microservicio todavía.
8. **IRIS multicanal desde diseño** → **Confirmado.** Telegram, push y email desde el inicio.

---

## 15. Conclusión

La arquitectura propuesta busca que Oraculo Survivor pueda lanzar fuerte en el Mundial 2026 sin caer en dos errores comunes: construir algo demasiado frágil para los picos reales del torneo o sobrediseñar una plataforma distribuida antes de validar operación y producto. La apuesta correcta para esta etapa es un core transaccional sólido, modularidad clara por agentes, colas y caché para desacoplar carga, y reglas versionadas que conviertan el producto en una plataforma multi-tournament real desde el principio.

Para el founder, la conversación clave no debería ser “qué stack suena más moderno”, sino “qué decisiones nos permiten lanzar rápido, operar con confianza y escalar sin rehacer el juego”. Bajo ese criterio, la propuesta recomendada es: **PostgreSQL como verdad del juego, Node/TypeScript + Express como backend base, React/Vite para frontend, Redis + BullMQ para tiempo real y jobs, y cuatro agentes bien definidos —ATLAS, ORÁCULO, HERMES e IRIS— dentro de una arquitectura modular coherente, extensible y auditable**.