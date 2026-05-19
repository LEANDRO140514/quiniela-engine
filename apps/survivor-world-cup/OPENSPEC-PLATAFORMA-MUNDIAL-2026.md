# OPENSPEC CONSOLIDADO · PLATAFORMA MUNDIAL 2026

**Estado:** borrador de trabajo para discusión con founder  
**Fecha:** mayo 2026  
**Horizonte:** build en 4 semanas sobre base Quiniela-Platform + stack ya visible en el monorepo  
**Idioma de operación:** ES primero, con soporte EN/PT desde la base compartida  
**Premisa:** esto no es “un Survivor con extras”. Es una **plataforma completa de Mundial** con adquisición, engagement, tensión competitiva, narrativa social e inteligencia pública.

---

## 0. Cómo leer este documento

Este OpenSpec no intenta cerrar todos los detalles. Intenta responder una pregunta más útil:

> **¿Qué construimos mañana, sobre qué base, en qué orden y qué sacrificamos para llegar vivos al 11 de junio?**

Puntos de partida usados para este consolidado:

- Las **Fases 1-4** existentes de `apps/survivor-world-cup` ya congelan bastante bien la lógica de Survivor: formato **2+1**, 3 vidas, 1 pick por ventana, no-repeat, hasta 8 ventanas, Spectator Mode, IRIS/ORÁCULO/ATLAS/HERMES.
- El founder redefine el scope: ya no es solo Survivor; ahora es una **plataforma umbrella** con 5 módulos.
- La base de build declarada es un fork de **Quiniela-Platform** con auth, torneos, picks, leaderboard, co-admin, i18n, scoring configurable, live scores, analytics, payments, Prisma/PostgreSQL, Express/Next.js y deploy en Railway.
- En el monorepo actual sí se ve claramente:
  - una base frontend `React + TypeScript + Vite + Zustand + Tailwind` en `apps/quiniela-2026`;
  - una base backend/infra `Express + PostgreSQL + Redis + BullMQ + observabilidad + Supabase` en `packages/algorithmus/*`.

Conclusión práctica: **no arrancamos de cero**, pero tampoco debemos asumir que todo el fork ya está integrado en este monorepo. Este documento define la **arquitectura objetivo de build inmediato**.

---

## 1. Visión de plataforma

## 1.0 Identidad de marca

**Marca umbrella:** **Oraculo Society**

### Sub-marcas confirmadas

| Sub-marca | Mapeo OpenSpec | Tagline |
|---|---|---|
| Oraculo Society | Home / Lead Magnet Mundial 2026 | La casa del juego, la data y la narrativa del Mundial 2026 |
| Oraculo Picks | La Gran Quiniela | Tu vision. Tu victoria. |
| Oraculo Survivor | Survivor | Solo el elegido sobrevive. |
| Oraculo AI | IA Challenge | La ciencia detras del instinto. |
| Oraculo Pool | Ligas privadas + Knockout Quiniela | Crea tu circulo. Domina el juego. |
| Oraculo League | Torneos largos post-Mundial | La saga de los mejores. |
| Oraculo Ritual | Stats / analytics para power users | Donde la data se vuelve destino. |

### Principio de naming

- **Oraculo Society** nombra la plataforma umbrella.
- **Oraculo Survivor** nombra el producto de eliminación.
- **Survivor** se mantiene cuando describe la mecánica de juego, por ejemplo **Survivor 2+1**.

## 1.1 Elevator pitch

**Oraculo Society** será una plataforma de Mundial 2026 donde un usuario puede:

- informarse;
- jugar;
- competir con amigos;
- seguir el torneo en vivo;
- enfrentarse a la IA;
- y quedarse dentro del ecosistema incluso si ya fue eliminado de un módulo.

La tesis no es “hacer una quiniela más”. La tesis es:

> **captar tráfico masivo con utilidad real, convertirlo en juego frecuente, escalar la tensión con Oraculo Survivor, reenganchar a eliminados con Oraculo Pool y diferenciar la marca con Oraculo AI como narrativa pública.**

---

## 1.2 Los 5 módulos

| Sub-marca | Módulo OpenSpec | Rol en la plataforma | Audiencia principal | Métrica north star |
|---|---|---|---|---|
| Oraculo Society | Lead Magnet Mundial 2026 | Adquisición masiva | Fans casuales del Mundial, SEO, tráfico social | usuarios nuevos registrados / sesiones orgánicas |
| Oraculo Picks | La Gran Quiniela | Retención masiva diaria | usuarios que quieren jugar todo el torneo sin eliminación | picks enviados por usuario / DAU recurrente |
| Oraculo Survivor | Survivor | Producto estrella emocional | usuarios competitivos, ligas privadas, creadores | supervivencia por ventana / share rate / premium intent |
| Oraculo Pool | Knockout Quiniela + ligas privadas | Reenganche fase final y capa social | eliminados de Oraculo Survivor + usuarios que llegan tarde | conversión a fase final / picks por usuario |
| Oraculo AI | IA Challenge | Diferenciación viral | curiosos, creadores, redes sociales, prensa | vistas públicas de picks IA / shares / captación asistida |
| Oraculo Ritual | Stats / analytics | Profundidad para power users | usuarios intensivos, analíticos y competitivos | recurrencia analítica / tiempo en dashboard |
| Oraculo League | Torneos largos post-Mundial | Extensión de lifecycle | usuarios recurrentes post-evento | retención post-Mundial / reactivación |

---

## 1.3 Rol estratégico de cada módulo

### 1. Lead Magnet Mundial 2026

No monetiza directamente al inicio. Su trabajo es:

- capturar tráfico orgánico;
- posicionar marca antes del arranque;
- retener sesiones durante el torneo;
- empujar registro y deep links al resto de módulos.

Debe sentirse como “el mejor hub utilitario del Mundial”, no como una landing vacía con CTA forzada.

### 2. Oraculo Picks

Es el módulo de frecuencia más alta.  
Si el usuario quiere jugar “todo el Mundial” sin morir, entra aquí.

Es el producto que más ayuda a:

- formar hábito;
- sostener DAU;
- poblar leaderboards;
- alimentar ligas privadas;
- crear transición natural hacia Knockout y AI Challenge.

### 3. Oraculo Survivor

Es el módulo con mayor carga emocional y mejor potencial premium/social.

No necesariamente será el módulo con más usuarios; sí debe ser el módulo con:

- mejor narrativa;
- mayor intensidad;
- mayor shareability;
- mayor valor percibido por usuario competitivo.

### 4. Oraculo Pool

Es el puente perfecto para:

- usuarios que llegan tarde;
- usuarios eliminados de Oraculo Survivor;
- usuarios fatigados por 104 picks;
- comunidades que solo quieren la fase decisiva.

No es side product: es el seguro de continuidad de engagement en eliminatorias.

### 5. Oraculo AI

No necesita “ganarle al mercado”. Necesita:

- picks visibles;
- probabilidades defendibles;
- lenguaje de marca fuerte;
- comparaciones públicas entre ORÁCULO y humanos;
- material que viaje bien por Telegram, X, WhatsApp e Instagram.

Es un módulo de diferenciación, contenido y adquisición asistida por conversación social.

---

## 1.4 Cómo se complementan

```text
SEO / social / shares
        |
        v
Lead Magnet ---------------> Registro simple
        |                          |
        |                          +------------------------------+
        v                                                         |
Descubre calendario, grupos, standings                            |
        |                                                         |
        +---------------------> Oraculo Picks <-------------------+
                                  |         |
                                  |         +----> Ligas privadas compartidas
                                  |
                                  +----> Oraculo Survivor
                                           |
                                           +----> Eliminado -> Spectator Mode
                                           |                 -> Oraculo Pool
                                           |
                                           +----> Sigue vivo -> share cards / premium intent
                                  
Todos los módulos consumen:
Fixture + Auth + Profiles + Leagues + Leaderboards + Payments + IRIS + ORÁCULO
```

### Mapa de engagement

- **Oraculo Society** trae volumen.
- **Oraculo Picks** crea hábito.
- **Oraculo Survivor** crea tensión y orgullo social.
- **Oraculo Pool** rescata a los que llegan tarde o salen de Oraculo Survivor.
- **Oraculo AI** amplifica conversación y diferencia la marca.

La plataforma funciona mejor cuando el usuario no es de “un módulo”, sino del ecosistema completo.

---

## 1.5 Flujo de usuario entre módulos

### Flujo ideal pre-torneo

1. Usuario entra por SEO: grupos, calendario o bracket.
2. Descubre que puede registrarse gratis.
3. Crea cuenta con Google/Apple/Telegram/email magic link.
4. Ve dashboard umbrella con módulos disponibles.
5. Entra a:
   - Oraculo Picks si quiere jugar todo;
   - Oraculo Survivor si quiere tensión;
   - Oraculo AI si quiere comparar picks con ORÁCULO.
6. Crea o se une a una liga.
7. Activa IRIS por Telegram.

### Flujo ideal durante fase de grupos

1. Consulta utilidades del Mundial.
2. Hace picks de Oraculo Picks.
3. Hace 1 pick de Oraculo Survivor por ventana.
4. Recibe recordatorios y recaps por IRIS.
5. Ve narrativa pública de ORÁCULO.
6. Comparte estado en su liga o en social.

### Flujo ideal post-eliminación de Oraculo Survivor

1. Usuario recibe eliminación clara pero digna.
2. No sale del ecosistema.
3. Pasa a:
   - Spectator Mode;
   - Oraculo Picks;
   - Oraculo Pool;
   - Oraculo AI;
   - actividad de su liga.

### Implicación de producto

El dashboard principal no debe organizarse por “features”, sino por **estado del usuario**:

- informarme;
- jugar hoy;
- revisar mis ligas;
- ver cómo va ORÁCULO;
- volver a entrar aunque ya me eliminaron.

---

## 1.6 Marca umbrella y arquitectura de naming

La marca principal ya está definida. La arquitectura debe soportar:

- `Oraculo Society`
- `Oraculo Picks`
- `Oraculo Survivor`
- `Oraculo Pool`
- `Oraculo AI`
- `Oraculo League`
- `Oraculo Ritual`

Decisión práctica:

- el dominio conceptual es uno;
- los módulos son productos/experiencias dentro del mismo sistema;
- auth, perfiles, ligas y pagos deben ser **Oraculo Society-first**, no producto-first.

---

## 2. Arquitectura compartida

## 2.1 Principio general

La plataforma debe construirse como un **core compartido multi-módulo** con una capa de experiencia específica por módulo.

No conviene levantar 5 productos separados. Conviene tener:

- una sola identidad de usuario;
- un solo fixture;
- una sola capa de ligas;
- una sola infraestructura de leaderboard;
- una sola capa de settlement;
- una sola capa de notificaciones;
- un solo backoffice operativo.

---

## 2.2 Diagrama ASCII de plataforma

```text
                                   ┌─────────────────────────────────────┐
                                   │        EXPERIENCIA UMBRELLA         │
                                   │  Web / PWA / SEO / Telegram entry   │
                                   └─────────────────┬───────────────────┘
                                                     │
      ┌──────────────────────┬───────────────────────┼───────────────────────┬───────────────────────┬──────────────────────┐
      │                      │                       │                       │                       │                      │
      v                      v                       v                       v                       v                      v
┌──────────────┐     ┌──────────────┐        ┌──────────────┐        ┌──────────────┐       ┌──────────────┐      ┌──────────────┐
│ Lead Magnet  │     │ Gran Quiniela│        │   Survivor   │        │   Knockout   │       │ IA Challenge │      │ Admin / Ops  │
│ grupos/SEO   │     │ 104 picks    │        │ 2+1 / vidas  │        │ 16avos-final │       │ ORÁCULO vs   │      │ backoffice   │
│ bracket/live │     │ leaderboard  │        │ spectator     │        │ puente final │       │ humanos      │      │ soporte/audit│
└──────┬───────┘     └──────┬───────┘        └──────┬───────┘        └──────┬───────┘       └──────┬───────┘      └──────┬───────┘
       │                    │                        │                        │                        │                     │
       └────────────────────┴────────────────────────┴────────────────────────┴────────────────────────┴─────────────────────┘
                                                     │
                                                     v
                                  ┌─────────────────────────────────────┐
                                  │          CAPA COMPARTIDA            │
                                  │ Auth / Profiles / Leagues / Billing │
                                  │ Fixtures / Picks / Settlement       │
                                  │ Leaderboards / Analytics / IRIS     │
                                  └─────────────────┬───────────────────┘
                                                    │
                 ┌───────────────────────────┬──────┼───────────┬───────────────────────────┐
                 │                           │      │           │                           │
                 v                           v      v           v                           v
          ┌──────────────┐            ┌──────────────┐   ┌──────────────┐           ┌──────────────┐
          │    ATLAS     │            │   ORÁCULO    │   │    HERMES    │           │     IRIS     │
          │ game engine  │            │ predictions  │   │ rules/fixture│           │ telegram/push│
          │ scoring      │            │ public intel │   │ config/admin │           │ email/social │
          └──────┬───────┘            └──────┬───────┘   └──────┬───────┘           └──────┬───────┘
                 │                           │                  │                          │
                 └───────────────────────────┴──────────────────┴──────────────────────────┘
                                                     │
                                                     v
                              ┌────────────────────────────────────────────────┐
                              │ PostgreSQL + Redis + BullMQ + Analytics store │
                              └────────────────────────────────────────────────┘
```

---

## 2.3 Bounded contexts recomendados

### Shared Platform Core

- auth
- profiles
- identities
- entitlements
- payments
- leagues
- memberships
- notifications
- analytics

### Fixture Core

- tournaments
- phases
- groups
- teams
- matches
- venues
- broadcasters
- results
- standings
- knockout tree

### Game Core

- entries
- picks
- validations
- settlement
- scoring
- lives
- no-repeat logic
- leaderboard snapshots

### Intelligence Core

- probabilities
- public predictions
- confidence labels
- AI snapshots
- human vs IA comparisons

### Experience Layer

- public SEO pages
- module dashboards
- share cards
- Telegram flows
- social narrative

---

## 2.4 Modelo de datos compartido (Prisma-style, no final)

El punto importante no es la sintaxis exacta. Es la estructura mental: **un mismo usuario puede participar en múltiples módulos y múltiples ligas, pero todo se apoya sobre el mismo fixture y el mismo motor compartido**.

```prisma
enum TournamentKind {
  LEAD_MAGNET
  QUINIELA_FULL
  SURVIVOR
  QUINIELA_KNOCKOUT
  AI_CHALLENGE
}

enum EntryStatus {
  ACTIVE
  ELIMINATED
  SPECTATOR
  COMPLETED
  CANCELLED
}

enum MatchStage {
  GROUP
  ROUND_OF_32
  ROUND_OF_16
  QUARTERFINAL
  SEMIFINAL
  THIRD_PLACE
  FINAL
}

enum PickOutcome {
  PENDING
  WON
  DRAW
  LOST
  VOID
}

enum LeaderboardScopeType {
  GLOBAL
  TOURNAMENT
  LEAGUE
  COUNTRY
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  CANCELED
}

model User {
  id               String              @id @default(cuid())
  email            String?             @unique
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  authIdentities   AuthIdentity[]
  profile          UserProfile?
  entries          TournamentEntry[]
  leagueMemberships LeagueMembership[]
  payments         Payment[]
  notifications    NotificationSubscription[]
}

model AuthIdentity {
  id               String   @id @default(cuid())
  userId           String
  provider         String
  providerUserId   String
  lastLoginAt      DateTime?
  user             User     @relation(fields: [userId], references: [id])

  @@unique([provider, providerUserId])
}

model UserProfile {
  id               String   @id @default(cuid())
  userId           String   @unique
  displayName      String
  avatarUrl        String?
  language         String   @default("es")
  countryCode      String?
  timezone         String?
  telegramHandle   String?
  marketingOptIn   Boolean  @default(false)
  user             User     @relation(fields: [userId], references: [id])
}

model Tournament {
  id               String             @id @default(cuid())
  slug             String             @unique
  kind             TournamentKind
  title            String
  season           String
  status           String
  brandKey         String?
  scoringConfig    Json
  rulesConfig      Json
  visibilityConfig Json?
  phases           TournamentPhase[]
  windows          TournamentWindow[]
  entries          TournamentEntry[]
  leagues          League[]
}

model TournamentPhase {
  id               String   @id @default(cuid())
  tournamentId     String
  stage            MatchStage
  label            String
  order            Int
  startsAt         DateTime
  endsAt           DateTime
  tournament       Tournament @relation(fields: [tournamentId], references: [id])
}

model TournamentWindow {
  id               String   @id @default(cuid())
  tournamentId     String
  phaseId          String?
  windowNumber     Int
  label            String
  lockAt           DateTime
  settleAt         DateTime?
  status           String
  config           Json
  tournament       Tournament @relation(fields: [tournamentId], references: [id])

  @@unique([tournamentId, windowNumber])
}

model Team {
  id               String   @id @default(cuid())
  fifaCode         String   @unique
  name             String
  shortName        String
  flagUrl          String?
  confederation    String?
}

model Group {
  id               String   @id @default(cuid())
  tournamentId     String
  code             String
  label            String

  @@unique([tournamentId, code])
}

model GroupStanding {
  id               String   @id @default(cuid())
  tournamentId     String
  groupId          String
  teamId           String
  played           Int
  won              Int
  drawn            Int
  lost             Int
  goalsFor         Int
  goalsAgainst     Int
  goalDiff         Int
  points           Int
  rank             Int
  updatedAt        DateTime @updatedAt

  @@unique([tournamentId, groupId, teamId])
}

model Venue {
  id               String   @id @default(cuid())
  code             String   @unique
  name             String
  city             String
  country          String
  timezone         String?
}

model Match {
  id               String   @id @default(cuid())
  tournamentId     String
  phaseId          String?
  windowId         String?
  stage            MatchStage
  matchNumber      Int?
  homeTeamId       String
  awayTeamId       String
  venueId          String?
  startsAt         DateTime
  broadcaster      String?
  state            String
  sourcePayload    Json?
  result           MatchResult?

  @@index([tournamentId, startsAt])
}

model MatchResult {
  id               String   @id @default(cuid())
  matchId          String   @unique
  homeGoals90      Int?
  awayGoals90      Int?
  homeGoals120     Int?
  awayGoals120     Int?
  penaltiesHome    Int?
  penaltiesAway    Int?
  settledAt        DateTime?
  officialStatus   String
  settlementMode   String
  match            Match    @relation(fields: [matchId], references: [id])
}

model TournamentEntry {
  id               String      @id @default(cuid())
  tournamentId     String
  userId           String
  status           EntryStatus
  currentLives     Int?
  totalPoints      Int         @default(0)
  rankCurrent      Int?
  joinedAt         DateTime    @default(now())
  metadata         Json?
  tournament       Tournament  @relation(fields: [tournamentId], references: [id])
  user             User        @relation(fields: [userId], references: [id])
  picks            Pick[]
  lifeEvents       LifeEvent[]

  @@unique([tournamentId, userId])
}

model Pick {
  id               String      @id @default(cuid())
  tournamentId     String
  entryId          String
  userId           String
  windowId         String?
  matchId          String?
  selectedTeamId   String?
  homeScorePred    Int?
  awayScorePred    Int?
  predictedOutcome String?
  confidence       Int?
  outcome          PickOutcome @default(PENDING)
  pointsAwarded    Int         @default(0)
  lockedAt         DateTime?
  settledAt        DateTime?
  source           String?
  metadata         Json?

  @@index([tournamentId, userId, windowId])
}

model UsedTeam {
  id               String   @id @default(cuid())
  tournamentId     String
  entryId          String
  teamId           String
  windowId         String
  createdAt        DateTime @default(now())

  @@unique([tournamentId, entryId, teamId])
}

model LifeEvent {
  id               String   @id @default(cuid())
  tournamentId     String
  entryId          String
  windowId         String?
  eventType        String
  delta            Int
  reason           String
  createdAt        DateTime @default(now())
}

model League {
  id               String   @id @default(cuid())
  tournamentId     String?
  slug             String
  name             String
  visibility       String
  joinCode         String   @unique
  ownerUserId      String
  settings         Json
  createdAt        DateTime @default(now())

  memberships      LeagueMembership[]

  @@unique([tournamentId, slug])
}

model LeagueMembership {
  id               String   @id @default(cuid())
  leagueId         String
  userId           String
  role             String
  joinedAt         DateTime @default(now())

  @@unique([leagueId, userId])
}

model LeaderboardSnapshot {
  id               String   @id @default(cuid())
  tournamentId     String
  scopeType        LeaderboardScopeType
  scopeId          String?
  snapshotKey      String
  generatedAt      DateTime @default(now())
  metadata         Json?
  rows             LeaderboardRow[]
}

model LeaderboardRow {
  id               String   @id @default(cuid())
  snapshotId       String
  entryId          String
  rank             Int
  score            Int
  wins             Int?
  tieBreak1        Int?
  tieBreak2        Int?
  deltaRank        Int?
}

model AiPrediction {
  id               String   @id @default(cuid())
  tournamentId     String
  matchId          String?
  publishedAt      DateTime
  modelVersion     String
  pickType         String
  predictedTeamId  String?
  predictedOutcome String?
  confidenceScore  Float?
  probabilities    Json
  narrative        Json?
  isPublic         Boolean  @default(true)
}

model NotificationSubscription {
  id               String   @id @default(cuid())
  userId           String
  channel          String
  topic            String
  enabled          Boolean  @default(true)
  metadata         Json?
}

model NotificationDelivery {
  id               String   @id @default(cuid())
  userId           String?
  tournamentId     String?
  channel          String
  templateKey      String
  status           String
  payload          Json
  sentAt           DateTime?
  providerMessageId String?
}

model Payment {
  id               String        @id @default(cuid())
  userId           String
  tournamentId     String?
  provider         String
  productType      String
  productRef       String?
  currency         String
  amountCents      Int
  status           PaymentStatus
  providerRef      String?
  metadata         Json?
  createdAt        DateTime      @default(now())
}
```

### Lectura operativa del modelo

- `Tournament` no significa solo “Survivor”. Significa cualquier competencia o experiencia gobernada por fixture y reglas.
- `TournamentEntry` permite que un mismo usuario tenga una entrada separada en Gran Quiniela, Survivor y Knockout.
- `Pick` debe soportar:
  - pick de equipo Survivor;
  - predicción de resultado Quiniela;
  - pick público IA.
- `League` debe poder ser:
  - compartida umbrella;
  - o scoped a un torneo específico según UX final.
- `AiPrediction` existe como objeto público reusable por módulo, no como feature escondida dentro de Survivor.

---

## 2.5 Reglas de modelado por tipo de módulo

### Lead Magnet

Consume principalmente:

- `Tournament`
- `Group`
- `GroupStanding`
- `Match`
- `MatchResult`
- `Venue`
- `AiPrediction` opcional para contenido

Produce:

- sesiones;
- registros;
- deep links;
- analítica de contenido;
- señales de interés por equipo/partido.

### Gran Quiniela

Consume:

- `Tournament`
- `Match`
- `TournamentEntry`
- `Pick`
- `LeaderboardSnapshot`
- `League`

Produce:

- picks masivos por partido;
- puntos acumulados;
- leaderboard global y por liga.

### Survivor

Consume:

- `TournamentWindow`
- `TournamentEntry`
- `Pick`
- `UsedTeam`
- `LifeEvent`
- `LeaderboardSnapshot`
- `AiPrediction`

Produce:

- estado de vidas;
- eliminaciones;
- narrativa de supervivencia;
- share cards de status.

### Knockout Quiniela

Consume el mismo engine de Quiniela, pero restringido a fases finales.

### IA Challenge

Consume:

- `AiPrediction`
- `Match`
- `Pick` humanos agregados/anónimos

Produce:

- comparación ORÁCULO vs mayoría;
- score público de la IA;
- contenido compartible.

---

## 2.6 APIs compartidas vs APIs por módulo

## 2.6.1 APIs compartidas

Estas deben vivir en el core.

### Auth / Profile

- `POST /auth/login`
- `POST /auth/link-telegram`
- `GET /me`
- `PATCH /me/profile`
- `GET /me/entitlements`

### Fixture / Mundial

- `GET /world-cup/overview`
- `GET /world-cup/groups`
- `GET /world-cup/groups/:groupCode`
- `GET /world-cup/standings`
- `GET /world-cup/calendar`
- `GET /world-cup/matches/:matchId`
- `GET /world-cup/bracket`

### Leagues

- `POST /leagues`
- `POST /leagues/join`
- `GET /leagues/:leagueId`
- `GET /leagues/:leagueId/members`
- `GET /leagues/:leagueId/activity`

### Leaderboards

- `GET /leaderboards/global`
- `GET /leaderboards/tournaments/:tournamentId`
- `GET /leaderboards/leagues/:leagueId`

### Notifications / IRIS

- `POST /notifications/preferences`
- `POST /telegram/link`
- `POST /telegram/test`

### Payments

- `POST /payments/checkout`
- `POST /payments/webhook/:provider`
- `GET /payments/history`

### ORÁCULO público

- `GET /oraculo/daily`
- `GET /oraculo/matches/:matchId`
- `GET /oraculo/scoreboard`
- `GET /oraculo/humans-vs-ai`

---

## 2.6.2 APIs por módulo

### Lead Magnet

- `GET /lead-magnet/home`
- `GET /lead-magnet/share/:assetKey`

### Gran Quiniela

- `GET /quiniela-full/dashboard`
- `POST /quiniela-full/picks/bulk`
- `GET /quiniela-full/my-picks`
- `GET /quiniela-full/rules`

### Survivor

- `GET /survivor/dashboard`
- `GET /survivor/windows/current`
- `POST /survivor/picks`
- `GET /survivor/lives`
- `GET /survivor/used-teams`
- `GET /survivor/spectator`

### Knockout Quiniela

- `GET /knockout/dashboard`
- `POST /knockout/picks/bulk`

### IA Challenge

- `GET /ai-challenge/home`
- `GET /ai-challenge/public-picks`
- `GET /ai-challenge/comparisons`

---

## 2.7 Mapeo sobre Quiniela-Platform existente

## 2.7.1 Qué reutilizar

Asumiendo el fork base descrito por el founder, esto **debe reutilizarse agresivamente**:

| Capacidad base | Reutilización recomendada |
|---|---|
| Auth | directa |
| Pools / torneos con state machine | directa con extensión a `tournament_kind` |
| Picks con validación | directa para Quiniela; adaptar para Survivor |
| Leaderboard con desempates | directa |
| Co-admin / admin tooling | directa |
| Multi-idioma ES/EN/PT | directa |
| Scoring configurable | directa, moviéndolo a engine por módulo |
| Live scores scraper | directa para fixture/result settlement |
| Analytics dashboard | directa |
| Payments (Polar / Mercado Pago) | directa, priorizando checkout simple |
| Prisma + PostgreSQL | directa |
| Express + Next.js | reutilizable; decidir convivencia con Vite según velocidad real |
| Railway deploy | directa para launch rápido |

## 2.7.2 Qué agregar

| Nuevo componente | Motivo |
|---|---|
| `TournamentKind` multi-módulo | distinguir Lead Magnet, Quiniela Full, Survivor, Knockout, AI Challenge |
| `TournamentWindow` explícito | Survivor necesita ventanas agrupadas y lock por ventana |
| `UsedTeam` + `LifeEvent` | reglas centrales de Survivor |
| `AiPrediction` público | ORÁCULO debe ser objeto de producto, no solo helper interno |
| `GroupStanding` + bracket public | Lead Magnet necesita capa editorial/utilitaria del Mundial |
| `NotificationDelivery` robusto | IRIS debe orquestar Telegram/push/email |
| `share artifacts` | cards sociales de estado, picks IA, ligas |
| `cross-module dashboard` | home umbrella para navegación y reenganche |

## 2.7.3 Qué modificar

| Componente | Cambio |
|---|---|
| `Tournament` | pasar de pool/contest clásico a entidad umbrella multi-tipo |
| `Pick` | soportar picks por partido y picks por ventana/equipo |
| `Leaderboard` | soportar scope por torneo, liga y global umbrella |
| `League` | compartir ligas entre módulos o permitir asociaciones múltiples |
| `Settlement engine` | separar settlement por tipo: match-result, quiniela-score, survivor-life |
| `Admin` | sumar control de ventanas, standings, ORÁCULO y narrativa IRIS |

## 2.7.4 Qué no construir ahora

- microservicios completos por agente;
- app nativa;
- marketplace de ligas;
- personalización extrema de branding por liga;
- IA generativa compleja por usuario;
- simuladores avanzados tipo “what-if” para todos los módulos.

---

## 2.8 Decisión de stack para llegar a tiempo

La decisión debe ser pragmática:

- **backend y persistencia**: seguir la base más madura del fork Quiniela-Platform;
- **infra operativa**: reutilizar Postgres, Redis/BullMQ, analytics y payments;
- **frontend**: no enamorarse de reescribir todo;
- **Telegram / IRIS / ORÁCULO**: montarlos como capas acopladas al core, no como productos aparte.

Si el fork base en Next.js ya está realmente maduro, **no conviene migrar frontend completo a Vite ahora**.  
Si el fork base no está integrado y la velocidad real está del lado de `apps/quiniela-2026` + componentes nuevos, entonces la recomendación es:

- usar la arquitectura visual/patrones del app Vite como referencia rápida;
- pero preservar el backend compartido y el modelo de datos central.

La decisión técnica correcta aquí no es ideológica. Es:

> **usar la ruta con menor riesgo de integración para launch en 4 semanas.**

---

## 3. Spec pragmático por módulo

## 3.1 Módulo 1 · Lead Magnet Mundial 2026

### Objetivo

Captar usuarios antes y durante el Mundial con utilidades reales, páginas indexables y contenido compartible.

### Métricas clave

- sesiones orgánicas
- CTR a registro
- registros nuevos atribuidos a SEO/social
- returning visitors durante fase de grupos
- depth de navegación a calendario, grupos y bracket

### Pantallas principales

- Home Mundial 2026
- Grupos
- Detalle de grupo
- Calendario completo
- Match center básico
- Tabla de posiciones en vivo
- Bracket eliminatorio
- Clasificaciones / escenarios
- Página pública ORÁCULO del día

### Reglas de negocio clave

- datos oficiales o normalizados del scraper son fuente de verdad;
- standings se recalculan automáticamente;
- horarios deben mostrarse en timezone del usuario;
- canal/broadcaster es informativo, no contractual;
- todas las páginas deben estar optimizadas para share y SEO.

### Datos que consume / produce

Consume:

- fixture, equipos, grupos, sedes, resultados, standings, bracket.

Produce:

- eventos analíticos;
- captación;
- links a registro;
- tráfico al resto de módulos.

### Dependencias de infra compartida

- Fixture engine
- HERMES para reglas/estructura
- ORÁCULO público
- Analytics
- Auth opcional para personalización

### Complejidad estimada

**Media**

No es difícil por lógica de juego, pero sí exige:

- SEO limpio;
- datos correctos;
- buena performance;
- actualización confiable.

---

## 3.2 Módulo 2 · La Gran Quiniela

### Objetivo

Ser el producto de retención masiva y frecuencia alta: 104 partidos, un usuario activo todo el Mundial.

### Métricas clave

- picks enviados por jornada
- DAU/WAU
- retención 7d
- participación en ligas
- picks completos por usuario
- uso de ORÁCULO como asistencia

### Pantallas principales

- Home Quiniela
- Mis picks
- Calendario de picks por fase
- Pantalla de pick por partido
- Confirmación / pick lock
- Leaderboard global
- Leaderboard de liga
- Historial de picks
- Reglas y scoring

### Reglas de negocio clave

- el usuario predice el resultado de cada partido;
- scoring base:
  - victoria pick correcto = 3 pts
  - empate pick correcto = 1 pt
  - derrota/inexacto = 0 pts
- criterio sobre tiempo reglamentario únicamente;
- picks se bloquean al inicio de cada partido;
- no hay eliminación;
- leaderboard acumulativo hasta la final;
- debe soportar ligas privadas.

### Datos que consume / produce

Consume:

- fixture completo;
- resultados oficiales;
- scoring config;
- ligas.

Produce:

- picks masivos;
- ranking acumulado;
- data comparativa contra ORÁCULO y comunidad.

### Dependencias de infra compartida

- Auth
- Tournament engine
- Picks engine
- Match settlement engine
- Leaderboard engine
- Leagues
- Analytics
- IRIS

### Complejidad estimada

**Media**

Es el módulo más directo de reutilizar desde Quiniela-Platform.

---

## 3.3 Módulo 3 · Oraculo Survivor

### Objetivo

Ser el producto premium emocional de la plataforma: menos volumen de picks, más tensión, más share, más identidad.

### Métricas clave

- entradas activas por ventana
- tasa de supervivencia por ventana
- picks enviados antes del lock
- shares de “sigo vivo” / “eliminado”
- activación de Telegram
- conversión a ligas privadas / premium

### Pantallas principales

- Landing/overview Oraculo Survivor
- Dashboard Oraculo Survivor
- Pantalla de pick por ventana
- Equipos disponibles / usados
- Estado de vidas
- Historial de ventanas
- Resultado de jornada
- Pantalla de eliminación
- Spectator Mode
- Leaderboard Oraculo Survivor
- Actividad de liga Oraculo Survivor

### Reglas de negocio clave

Resumen consolidado desde Fases 1-4:

- formato **Survivor 2+1**;
- todos arrancan con **3 vidas**;
- **1 pick por ventana**;
- si el equipo elegido gana, sobrevive;
- si empata o pierde, consume una vida;
- **no se puede repetir selección**;
- máximo **8 ventanas**: 3 de grupos + 5 de eliminatorias;
- el pick cierra antes del primer partido elegible de la ventana;
- Spectator Mode desde lanzamiento;
- Zombie Mode no entra al MVP.

### Datos que consume / produce

Consume:

- ventanas;
- equipos elegibles;
- resultados;
- ORÁCULO contextual;
- ligas.

Produce:

- estado de vidas;
- eliminaciones;
- used teams;
- recaps;
- social cards.

### Dependencias de infra compartida

- Auth
- Tournament windows
- Picks engine especializado
- Life ledger
- Used team ledger
- Leaderboards
- Leagues
- IRIS
- ORÁCULO

### Complejidad estimada

**Alta**

No por interfaz, sino por consistencia de reglas y settlement.

---

## 3.4 Módulo 4 · Knockout Quiniela

### Objetivo

Sostener intensidad y engagement desde 16avos hasta la final, especialmente para usuarios eliminados de Survivor o usuarios que llegan tarde.

### Métricas clave

- conversiones desde Survivor eliminado
- entradas nuevas durante fase knockout
- picks por usuario en fase final
- retención hasta final
- participación en ligas pequeñas/finales

### Pantallas principales

- Home Knockout
- Picks de fase final
- Leaderboard Knockout
- Historial de fase final
- Pantalla de onboarding rápido

### Reglas de negocio clave

- mismo motor conceptual que Gran Quiniela;
- sólo incluye partidos de eliminación directa;
- menos carga operativa;
- scoring consistente con Quiniela Full para evitar confusión;
- fuerte deep link desde Survivor eliminado y home umbrella.

### Datos que consume / produce

Consume:

- fases finales del fixture;
- picks;
- resultados;
- ligas.

Produce:

- ranking fase final;
- nueva oportunidad competitiva;
- continuidad de sesiones.

### Dependencias de infra compartida

- mismas que Gran Quiniela, con subset de fixture

### Complejidad estimada

**Baja-Media**

Debe construirse como reuso, no como módulo separado desde cero.

---

## 3.5 Módulo 5 · IA Challenge — Ganale a la IA

### Objetivo

Convertir ORÁCULO en activo de marca, contenido y viralidad.

### Métricas clave

- vistas de picks IA
- shares de comparación IA vs usuarios
- CTR desde cards públicas a registro
- tasa de mención de ORÁCULO en ligas / Telegram
- precisión pública percibida

### Pantallas principales

- Home IA Challenge
- Picks públicos del día
- ORÁCULO pre-torneo
- Match comparison: IA vs comunidad
- Scoreboard humanos vs IA
- Histórico ORÁCULO
- Share cards públicas

### Reglas de negocio clave

- ORÁCULO publica picks antes del lock de cada partido;
- debe quedar visible qué eligió y con qué confianza;
- puede comparar contra mayoría de usuarios de forma agregada/anónima;
- el objetivo no es prometer precisión perfecta;
- el objetivo sí es construir narrativa:
  - ORÁCULO eligió X;
  - la mayoría eligió Y;
  - hoy ganó ORÁCULO / hoy ganó la comunidad.

### Datos que consume / produce

Consume:

- probabilities;
- fixture;
- picks humanos agregados;
- resultados.

Produce:

- contenido público;
- assets sociales;
- diferenciación;
- señales de interés por partido/equipo.

### Dependencias de infra compartida

- ORÁCULO
- fixture
- analytics
- share engine
- IRIS

### Complejidad estimada

**Media**

La dificultad real está en packaging narrativo, no en ML sofisticado.

---

## 4. Agentes del sistema

## 4.1 ATLAS — motor multi-tipo

### Rol

ATLAS es el corazón operativo. Debe gobernar:

- entries;
- picks;
- validaciones;
- scoring;
- settlement;
- vidas;
- leaderboards;
- estados de torneo.

### Qué resuelve

- misma base para Quiniela Full, Survivor y Knockout;
- reglas específicas por `tournament_kind`;
- idempotencia de lock y settlement;
- source of truth competitivo.

### Entradas

- fixture y resultados oficiales;
- rules config;
- scoring config;
- picks de usuarios.

### Salidas

- pick accepted / rejected;
- points awarded;
- life events;
- entry status changes;
- leaderboard snapshots;
- domain events para IRIS y analytics.

### Decisión de diseño

ATLAS no debe estar acoplado a UX.  
La UX cambia; el motor no.

---

## 4.2 ORÁCULO — picks IA y narrativa pública

### Rol

ORÁCULO es una capa transversal de inteligencia práctica y contenido público.

### Responsabilidades

- publicar picks por partido;
- asignar probabilidades/confianza;
- comparar IA vs comunidad;
- alimentar cards públicas;
- asistir decisiones dentro de Survivor y Quiniela.

### Qué no debe hacer

- bloquear el flujo de pick si falla;
- posicionarse como promesa de certeza;
- volverse dependencia dura del settlement.

### Inputs

- fixture;
- data histórica / odds / heurísticas;
- resultados;
- agregados de picks humanos.

### Outputs

- `AiPrediction`;
- copy público;
- insights para dashboard;
- comparativas para share/social.

---

## 4.3 HERMES — reglas, calendario y configuración

### Rol

HERMES es la capa de consistencia operativa y editorial.

### Responsabilidades

- cargar/configurar torneo;
- definir ventanas Survivor;
- administrar groups/standings/bracket;
- versionar reglas;
- habilitar overrides manuales;
- soportar backoffice.

### Inputs

- estructura oficial del Mundial;
- decisiones de producto;
- operaciones manuales de admin.

### Outputs

- fixtures limpios;
- ventanas correctas;
- config versionada;
- soporte al OpenSpec operativo.

---

## 4.4 IRIS — Telegram, push, email y narrativa

### Rol

IRIS convierte eventos del sistema en retorno y emoción.

### Responsabilidades

- onboarding Telegram;
- recordatorios de pick;
- confirmaciones;
- resultados;
- recaps;
- movimientos de liga;
- share loops.

### Prioridad de canales para MVP

1. Telegram
2. Email transaccional
3. Push web si entra simple

### Reglas de diseño

- no spam;
- mensajes cortos;
- foco en decisión o estado;
- fuerte soporte a Survivor y ligas.

---

## 4.5 Interacción entre agentes

```text
HERMES define fixture, fases, ventanas y reglas
        |
        v
ATLAS habilita picks, valida, bloquea, liquida y rankea
        |
        +-----------------> IRIS notifica y dramatiza
        |
        +-----------------> ORÁCULO contextualiza y publica
        |
        +-----------------> Analytics mide comportamiento
```

Principio operativo:

- **HERMES define**
- **ATLAS decide**
- **ORÁCULO interpreta**
- **IRIS distribuye**

---

## 5. Roadmap de build en 4 semanas

Este roadmap asume brutal foco.  
No es “todo perfecto”; es “plataforma jugable, entendible y operable”.

---

## 5.1 Semana 1 — Lead Magnet + fixture base + SEO

### Objetivo

Poner arriba la capa pública del Mundial y el core de fixture compartido.

### Entregables concretos

- modelo base de Mundial 2026:
  - equipos
  - grupos
  - sedes
  - partidos
  - fases
- páginas públicas:
  - home
  - grupos
  - calendario
  - standings
  - bracket placeholder si aún no está completo
- ingestión/normalización de resultados
- timezone local por usuario
- CTAs a registro
- analytics base
- base visual umbrella

### Qué se reutiliza de Quiniela-Platform

- auth si ya está operativo
- data ingestion / live scores
- i18n
- admin básico
- analytics dashboard
- Prisma/Postgres

### Qué se construye nuevo

- entidad de groups/standings/bracket
- páginas SEO del Mundial
- navegación umbrella
- HERMES para fixture/config del Mundial

### Criterios de completitud

- usuario puede navegar Mundial 2026 sin login;
- standings y calendario se actualizan correctamente;
- páginas públicas son compartibles e indexables;
- existe CTA consistente hacia registro/juego;
- fixture es usable por los módulos de juego.

---

## 5.2 Semana 2 — La Gran Quiniela

### Objetivo

Lanzar el producto de retención masiva sobre el core ya existente.

### Entregables concretos

- torneo Quiniela Full creado en backend;
- picks por partido;
- scoring 3/1/0 sobre reglamentario;
- leaderboard global;
- leaderboard por liga;
- historial de picks;
- UX de picks simple y rápida;
- reglas visibles;
- reminders básicos vía IRIS.

### Qué se reutiliza de Quiniela-Platform

- torneo/pools
- picks con validación
- scoring configurable
- leaderboard con desempates
- ligas privadas
- multi-idioma

### Qué se construye nuevo

- adaptación a formato Mundial 2026 completo de 104 partidos;
- dashboard umbrella para entrar al módulo;
- copy y narrativa específica de Mundial;
- integración de ORÁCULO pública/light dentro del flujo.

### Criterios de completitud

- usuario registrado puede enviar picks;
- sistema bloquea picks por inicio de partido;
- se asignan puntos correctamente;
- leaderboard responde;
- liga privada funciona de punta a punta.

---

## 5.3 Semana 3 — Survivor

### Objetivo

Montar el producto estrella emocional encima del mismo core.

### Entregables concretos

- torneo Oraculo Survivor activo;
- ventanas configuradas;
- 3 vidas;
- no-repeat team validation;
- used teams ledger;
- settlement de vida por ventana;
- dashboard Oraculo Survivor;
- pantalla de pick;
- eliminación;
- Spectator Mode;
- share cards básicas;
- alertas Telegram críticas.

### Qué se reutiliza de Quiniela-Platform

- auth
- tournament state machine
- picks base
- ligas
- leaderboard engine
- admin
- payments si Oraculo Survivor premium entra desde launch

### Qué se construye nuevo

- `TournamentWindow`
- `UsedTeam`
- `LifeEvent`
- settlement Oraculo Survivor
- UX de estado de vidas
- Spectator Mode
- flujos IRIS específicos de Oraculo Survivor

### Criterios de completitud

- pick inválido por equipo repetido es rechazado;
- pick ganador conserva vidas;
- pick empatado/perdedor descuenta vida;
- entry se elimina correctamente al llegar a cero;
- usuario eliminado sigue teniendo utilidad dentro del sistema;
- leaderboard y actividad de liga reflejan el estado real.

---

## 5.4 Semana 4 — IA Challenge + social loops + polish

### Objetivo

Cerrar la capa de diferenciación pública, reenganche y pulido de launch.

### Entregables concretos

- ORÁCULO publica picks diarios;
- home de AI Challenge;
- comparativa IA vs comunidad;
- share cards públicas;
- deep links cruzados entre módulos;
- recap social por partido/ventana;
- polishing de dashboard umbrella;
- observabilidad y runbooks básicos;
- smoke tests operativos pre-launch.

### Qué se reutiliza de Quiniela-Platform

- analytics
- live scores
- dashboard admin
- payments si hay premium/upsells

### Qué se construye nuevo

- entidad `AiPrediction`
- score público IA
- páginas social-first
- mensajes IRIS de narrativa comparativa
- loops de reenganche desde Survivor eliminado a Knockout

### Criterios de completitud

- ORÁCULO publica antes del lock;
- la comparación contra usuarios es visible;
- los módulos se linkean entre sí;
- IRIS ya empuja recordatorios y recaps clave;
- la plataforma completa puede operar con flujo real del torneo.

---

## 6. Prioridades de sacrificio

## 6.1 Must-have para llegar al 11 de junio

Si esto no está, no hay launch sano.

### Plataforma

- auth funcional
- fixture confiable
- admin/backoffice básico
- analytics mínimos
- ligas privadas básicas
- leaderboards funcionales
- settlement correcto

### Lead Magnet

- grupos
- calendario
- standings
- bracket básico
- SEO y sharing mínimos

### Gran Quiniela

- picks
- scoring 3/1/0
- leaderboard
- ligas

### Survivor

- 3 vidas
- 1 pick por ventana
- no-repeat
- eliminación correcta
- Spectator Mode

### IRIS

- linking Telegram
- recordatorios
- resultados

### ORÁCULO

- picks públicos básicos
- comparación simple con comunidad

---

## 6.2 Should-have para la primera semana del Mundial

- share cards mejores
- recap de ligas
- comparativas humanas vs IA más pulidas
- dashboard umbrella más sofisticado
- onboarding más contextual por módulo
- emails transaccionales más completos
- páginas públicas de match center más ricas
- rankings por país

---

## 6.3 Nice-to-have post-launch

- push web completo
- creator leagues con branding más fuerte
- premium analytics avanzados
- escenarios clasificatorios interactivos
- simuladores “qué pasa si…”
- badges y status cosmetics
- score histórico de ORÁCULO por selección/fase
- experiencias sponsor-backed

---

## 7. Decisiones de producto recomendadas para mañana

Estas son las decisiones que conviene asumir ya para no frenar build:

### 7.1 Plataforma antes que módulo aislado

No construir “Survivor y luego vemos”.  
Construir el core umbrella desde el día 1.

### 7.2 Quiniela Full entra antes que Survivor

Porque:

- reutiliza más del fork base;
- genera hábito más rápido;
- pobla ligas y leaderboards;
- reduce riesgo de tener solo un producto de eliminación.

### 7.3 Survivor sigue siendo la narrativa hero

Aunque no sea el primer módulo técnicamente listo, sí debe ser el **producto héroe emocional de marca**.

### 7.4 ORÁCULO es feature pública, no interna

Si ORÁCULO no se ve, no diferencia.  
Debe vivir en:

- páginas públicas;
- picks;
- comparativas;
- Telegram;
- share cards.

### 7.5 Knockout no se diseña aparte

Debe ser un **derivado del engine de Quiniela Full** con subset de fases, no un producto nuevo desde cero.

---

## 8. Riesgos principales

## 8.1 Riesgos de producto

- lanzar demasiadas cosas sin una home umbrella clara;
- confundir al usuario entre Quiniela y Survivor;
- sobrevalorar la IA y subdiseñar la narrativa;
- subestimar el poder del Lead Magnet como adquisición.

## 8.2 Riesgos técnicos

- el fork base real no está completamente integrado al monorepo actual;
- settlement inconsistente entre resultados y leaderboards;
- modelado pobre de `TournamentKind` y `Pick`;
- cron/locks de ventanas Survivor frágiles;
- dependencia excesiva de scraping manual o no estable.

## 8.3 Riesgos operativos

- llegar con backoffice insuficiente;
- no tener runbooks para correcciones/manual overrides;
- no tener mensajes preparados para incidencias;
- no tener ownership claro por módulo y por agente.

---

## 9. Propuesta de estructura de repositorio objetivo

No es obligatorio mover todo hoy, pero esta es la forma correcta de pensar el build:

```text
apps/
  world-cup-web/
  world-cup-admin/
  survivor-world-cup/          # docs / specs / assets

packages/
  platform-core/
    auth/
    profiles/
    leagues/
    payments/
    notifications/
    analytics/

  fixture-core/
    teams/
    groups/
    standings/
    matches/
    bracket/

  game-core/
    atlas/
      tournaments/
      picks/
      scoring/
      settlement/
      leaderboards/
      survivor/
      quiniela/

  intelligence/
    oraculo/

  messaging/
    iris/

  ops/
    hermes/
```

Si no hay tiempo para refactor estructural, al menos sí debe existir esta separación lógica dentro del código.

---

## 10. Qué haría mañana a primera hora

Si el equipo se sienta mañana, el orden correcto es:

1. **Congelar el modelo de dominio compartido**:
   - tournaments
   - entries
   - picks
   - windows
   - used teams
   - life events
   - leagues
   - leaderboards
   - ai predictions

2. **Confirmar qué parte del fork Quiniela-Platform ya está realmente disponible** en este monorepo y qué parte sigue fuera.

3. **Elegir una sola ruta frontend de launch**:
   - continuar sobre Next del fork si está maduro;
   - o montar la experiencia rápida con el stack visible Vite/React si eso acelera.

4. **Implementar fixture + pages públicas + auth** antes de expandir producto.

5. **Construir Quiniela Full primero** para asegurar frecuencia y base de ligas.

6. **Montar Survivor encima del mismo core**, no como app aparte.

7. **Cerrar semana 4 con ORÁCULO visible y loops sociales**, no con features internas invisibles.

---

## 11. Cierre ejecutivo

La oportunidad no es lanzar “otro juego del Mundial”.  
La oportunidad es lanzar una **plataforma de Mundial con un motor compartido y cinco loops complementarios**:

- utilidad;
- hábito;
- tensión;
- reenganche;
- narrativa pública.

Si priorizamos bien, el build en 4 semanas sí es razonable.  
Pero solo bajo una condición:

> **todo lo que no empuje adquisición, picks, settlement, ligas, leaderboards o narrativa visible debe perder prioridad inmediatamente.**

Este documento no propone perfección.  
Propone una plataforma suficientemente clara para construir mañana, discutir hoy y lanzar a tiempo.

---

## 12. Decisiones del founder (cerradas)

1. **Home:** Hub editorial + lobby híbrido. SEO/tráfico + acceso rápido al juego.
2. **Ligas:** Cross-module. Una sola liga puede jugar Oraculo Survivor, Oraculo Picks, Oraculo Pool y Oraculo AI. Maximiza retención.
3. **Hero marketing:** Oraculo Survivor como hook emocional. Debajo: Oraculo Picks, Oraculo AI, pools, stats.
4. **Monetización launch:** Cuantificar costo de producción primero. Enfatizar "entre amigos". Opciones free y de costo en 3 etapas (mundial total, fase eliminación, survivor). Premium features ligeras + sponsor pool + ligas privadas premium opcionales. NO complicar pagos aún.
5. **Fixture provider:** Abstraído desde el inicio. No casarse con una API.
6. **ORÁCULO:** Una sola voz de marca. Fortalece identidad y narrativa.