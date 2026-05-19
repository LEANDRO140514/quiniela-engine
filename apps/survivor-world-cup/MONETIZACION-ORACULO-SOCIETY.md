# PROPUESTA DE MONETIZACION · ORACULO SOCIETY

## Resumen ejecutivo

La recomendacion para Oraculo Society es un modelo **freemium social-first**: el producto base debe ser gratis para maximizar adquisicion, viralidad y ligas entre amigos; el ingreso debe venir de **pases por etapa**, **bundle completo**, **ligas privadas premium pagadas por el creador**, **sponsors** y una capa ligera de **Ritual premium** integrada al bundle.

La clave no es cobrar por “entrar a jugar”, sino cobrar por **competir en serio**, **organizar mejor a tu grupo**, **tener herramientas de analisis** y **acceder a prize pools premium** sin que el producto se sienta casino, sportsbook o gambling.

---

## 0. Costo de produccion estimado primero

### 0.1 Supuestos operativos

- Stack ya definido/reutilizable: `Express/Next`, `PostgreSQL`, `Redis/BullMQ`, analytics, payments, deploy en Railway, Telegram/IRIS, fixture provider abstraido.
- Horizonte: lanzamiento en ~4 semanas.
- Objetivo: cash-cost realista para operar el Mundial, **sin inflar con estructura enterprise**.
- Alcance de costo: infraestructura, servicios y operacion del torneo; **no incluye sueldos founder/full-time team**.

### 0.2 Costo mensual estimado durante el Mundial

| Rubro | Supuesto | Rango mensual USD |
|---|---|---:|
| Railway app + workers + jobs | web, api, worker, cron, staging minima | 120 - 350 |
| PostgreSQL administrado | produccion + backups | 80 - 220 |
| Redis / queues | locks, reminders, leaderboard jobs | 30 - 120 |
| Observabilidad / logs | errores, alertas, trazas basicas | 20 - 80 |
| API de futbol | fixture, resultados, standings, livescore | 29 - 79 |
| Email / transactional | magic links, receipts, alerts fallback | 15 - 60 |
| Telegram bot / webhook infra | costo bajo, principalmente compute | 10 - 40 |
| Dominio / DNS / SSL | prorrateado mensual | 5 - 15 |
| Asset generation / share cards | imagenes sociales y storage | 15 - 60 |
| Soporte operativo / fraude menor | buffer de chargebacks y soporte | 40 - 150 |
| **Total cash operativo mensual** | pico de torneo | **364 - 1,174** |

### 0.3 Fees variables relevantes

| Rubro | Referencia |
|---|---|
| Payment processing | Stripe standard visible: **2.9% + USD 0.30** por transaccion exitosa |
| Tarjetas internacionales | puede sumar ~1.5% adicional |
| FX / conversion | puede sumar ~1% si se cobra en otra moneda |
| Prize pool | recomendado financiarlo con una mezcla de entries premium + sponsor pool |

### 0.4 Costo de produccion de lanzamiento

Si el objetivo es salir en 4 semanas sin complicar pagos ni compliance:

- **Cash de lanzamiento minimo**: USD **3,000 - 6,000**
  - 1 mes de infraestructura y servicios
  - API provider
  - pasarela
  - dominio
  - buffers operativos
- **Cash prudente para lanzamiento + torneo completo**: USD **8,000 - 15,000**
  - 2 meses de operacion
  - contingencias
  - soporte
  - mayor uso de compute durante ventanas pico

### 0.5 Break-even operativo

Tomando un esquema de prize allocation prudente y fees de cobro:

- **Pase completo**: break-even operativo con ~**90-110** compradores
- **Survivor standard**: break-even operativo con ~**140-170** compradores
- **Picks standard**: break-even operativo con ~**220-260** compradores

Conclusión: **el costo de operar no es el problema**. El reto real es convertir suficiente volumen social en tickets premium y sponsors, no la infraestructura.

---

## 1. Principios de monetizacion

1. **Free first** para adquisicion y entre amigos.
2. **No vender ventaja competitiva directa**: nada de vidas extra, picks extra, retries pagos o boosts.
3. **Cobrar por profundidad, status, organizacion y premios premium**, no por fairness.
4. **Tres productos pagos claros**:
   - Etapa 1: Mundial total / Picks
   - Etapa 2: Eliminacion / Knockout-Pool
   - Etapa 3: Survivor
5. **Bundle simple** para no complicar pagos.
6. **Pool privado premium** pagado por el creador, no por cada amigo.
7. **IA y Ritual** como capa de valor, no como checkout independiente en launch.

---

## 2. Estructura de monetizacion

## 2.1 Tiers recomendados

### Tier 1 · Oraculo Society Free

Debe incluir suficiente valor para que invitar amigos sea obvio:

- registro gratis
- acceso a Oraculo Picks base
- acceso a Oraculo Survivor base
- acceso a Oraculo Pool base
- acceso a Oraculo AI publico
- acceso a Oraculo Ritual basico
- crear y unirse a ligas privadas basicas
- leaderboard global y leaderboard entre amigos
- reminders por Telegram/email
- share cards basicas

### Tier 2 · Passes por etapa

Tres SKUs simples, cada uno con valor claro:

1. **Picks Pass**  
   para quien quiere jugar los 104 partidos y competir todo el Mundial.

2. **Knockout Pass**  
   para quien quiere entrar fuerte en fase final o reengancharse despues.

3. **Survivor Pass**  
   producto premium flagship, mas emocional y con mejor monetizacion directa.

### Tier 3 · Society Full Pass

Bundle con descuento para quien quiere jugar todo el ecosistema:

- Picks
- Knockout
- Survivor
- ORACULO avanzado
- Ritual premium
- perks sociales y badges

### Tier 4 · Private League Premium

Pagado por el creador/organizador:

- League Pro
- League Creator
- League Brand

---

## 2.2 FREE vs PAGO por sub-marca

### Oraculo Picks

**FREE**
- picks de los 104 partidos
- scoring base G=3, E=1, P=0
- leaderboard global basico
- ranking en ligas
- comparacion simple con amigos

**PAGO**
- capa premium de leaderboard
- comparativas avanzadas vs liga/global/IA
- recap inteligente por etapa
- acceso a premios premium
- Ritual stats integrados para picks

### Oraculo Survivor

**FREE**
- 1 entrada individual
- 3 vidas segun reglas base del producto
- 1 pick por ventana
- no-repeat
- acceso a Spectator Mode al ser eliminado
- ranking basico y recordatorios

**PAGO**
- ORACULO Survivor avanzado
- planner de picks por ventana
- escenarios de supervivencia
- dashboards comparativos
- badge premium
- elegibilidad a premios premium

### Oraculo AI

**FREE**
- picks publicos de IA
- humanos vs IA
- narrativas shareables

**PAGO**
- explicaciones avanzadas
- historial de performance por etapa
- insights comparativos con tus picks

Recomendacion: **no vender Oraculo AI como SKU standalone en launch**; usarlo como feature de pases y bundle.

### Oraculo Pool

**FREE**
- crear liga
- unirse por link/codigo
- tabla basica
- activity feed simple

**PAGO**
- multi-admin
- branding ligero
- export de resultados
- announcements
- analytics de engagement
- featured recap
- sponsor slot / creator identity

### Oraculo League

**FREE**
- waitlist y teaser post-Mundial

**PAGO**
- no monetizar fuerte ahora
- usarlo para captar continuidad post-evento

### Oraculo Ritual

**FREE**
- estadisticas esenciales
- forma reciente
- picks populares
- standings basicos

**PAGO**
- profundidad analitica
- tendencias por ventana
- lecturas de riesgo
- comparativas avanzadas

Recomendacion: en launch, **Ritual premium debe ir incluido en Full Pass** y no como checkout separado.

---

## 3. Pricing concreto recomendado

### 3.1 Tipo de cambio de referencia

Para simplificar comunicacion:

- **1 USD ≈ 17.5 MXN**
- **1 USD ≈ 1,150 ARS**
- **1 USD ≈ 4,000 COP**

Nota: ARS y COP pueden moverse fuerte; actualizar equivalencias semanalmente, pero mantener el pricing principal en USD.

### 3.2 Pricing por etapa

| Producto | Early Bird | Standard | Last Call |
|---|---:|---:|---:|
| **Etapa 1 · Picks Pass** | **USD 7.99** | **USD 9.99** | **USD 12.99** |
| **Etapa 2 · Knockout Pass** | **USD 4.99** | **USD 5.99** | **USD 7.99** |
| **Etapa 3 · Survivor Pass** | **USD 11.99** | **USD 14.99** | **USD 17.99** |
| **Pase Completo · Society Full Pass** | **USD 18.99** | **USD 24.99** | **USD 29.99** |

### 3.3 Equivalencias aproximadas

| Producto | USD | MXN aprox | ARS aprox | COP aprox |
|---|---:|---:|---:|---:|
| Picks Pass Standard | 9.99 | 175 | 11,500 | 40,000 |
| Knockout Pass Standard | 5.99 | 105 | 6,900 | 24,000 |
| Survivor Pass Standard | 14.99 | 262 | 17,250 | 60,000 |
| Full Pass Standard | 24.99 | 437 | 28,750 | 100,000 |

### 3.4 Racional del pricing

- **Picks** debe sentirse accesible y masivo.
- **Knockout** debe ser una compra impulsiva y facil de justificar.
- **Survivor** puede cargar el ticket mas alto porque es el producto estrella emocional.
- **Full Pass** debe verse como la compra inteligente.

### 3.5 Descuento del bundle

Suma de standard por separado:

- Picks 9.99
- Knockout 5.99
- Survivor 14.99
- **Total separado: USD 30.97**

Bundle standard recomendado:

- **USD 24.99**
- descuento real: **~19.3%**

Es suficiente para impulsar bundle, sin regalar demasiado valor.

---

## 4. Pricing de ligas privadas premium

La recomendacion es que el organizador pague, no cada miembro.

| Plan | Precio | Alcance recomendado |
|---|---:|---|
| **League Pro** | **USD 24.99** | hasta 100 miembros, amigos/oficina/comunidad chica |
| **League Creator** | **USD 79** | hasta 300 miembros, creador o comunidad activa |
| **League Brand** | **USD 499+** | marca, medio, activacion patrocinada |

### 4.1 Que desbloquea cada nivel

**League Pro**
- 2 admins
- branding ligero
- announcements
- export CSV
- recap de liga

**League Creator**
- todo lo anterior
- hasta 5 admins
- sponsor slot
- analytics de engagement
- recap visual premium

**League Brand**
- setup asistido
- sponsor placement
- activacion custom
- reporting comercial

### 4.2 Que NO cobrar al lanzamiento

- fee por miembro
- fee por invitacion
- fee por cada pool creado

Eso mata el crecimiento organico entre amigos.

---

## 5. Benchmarks de mercado

## 5.1 Referencias utiles

### ESPN Fantasy

- benchmark de **adquisicion masiva free**
- posicionamiento visible: **100% free**
- private leagues como core del producto
- leccion para Oraculo: el free debe ser suficientemente serio para que la gente invite a su grupo completo

### Yahoo Survival

- survivor social **free-to-play**
- grupos privados con amigos
- muestra que el survivor puede funcionar gratis en la capa base mientras la monetizacion vive en otras capas

### Superbru

- producto base **free ad-supported**
- Premium visible desde **USD 3.49/mes**
- monetiza con:
  - sin anuncios
  - mas pools
  - insights
  - badge/estatus
- leccion para Oraculo: el premium ligero si convierte cuando agrega comodidad, analisis y status

### OfficeFootballPool / RunYourPool / SplashSports

- benchmark de **hosting de pools privadas**
- foco en commissioner tools y organizacion social
- lenguaje de “entertainment only” util para mantener distancia con betting
- leccion para Oraculo: cobrar al organizador es mas sano que cobrar entrada individual a todos

## 5.2 Conclusiones de benchmark

1. El mercado valida que **free social + premium ligero** funciona.
2. El mercado valida que **private leagues** son motor de growth.
3. El mercado no exige paywall duro para tener monetizacion.
4. El espacio premium se gana con:
   - insights
   - status
   - menos friccion
   - mejor experiencia social

---

## 6. Modelo de revenue recomendado

## 6.1 Lineas principales

1. **Passes por etapa**
2. **Pase completo**
3. **Ligas privadas premium**
4. **Sponsors**
5. **Merchandising digital**
6. **Ritual premium** como valor incluido en bundle y posible add-on post-launch

## 6.2 Orden de prioridad

### Ingreso principal

- Survivor Pass
- Full Pass
- Picks Pass

### Ingreso secundario

- League Pro / Creator / Brand

### Ingreso amplificador

- sponsor pool

### Ingreso incremental

- badges
- cosmetics
- founder packs

---

## 7. Proyeccion de revenue

## 7.1 Supuestos por escenario

### Mix de compra B2C sugerido

Entre usuarios pagos:

- 35% Picks
- 15% Knockout
- 25% Survivor
- 25% Full Pass

ARPPU estimado por mezcla:

- **Conservador:** USD 11.50
- **Base:** USD 12.50
- **Optimista:** USD 13.50

### Supuesto de conversion

| Escenario | Usuarios registrados | Conversion a pago |
|---|---:|---:|
| Conservador | 10,000 | 4% |
| Base | 50,000 | 7% |
| Optimista | 150,000 | 10% |

## 7.2 Revenue por escenario

| Linea | Conservador | Base | Optimista |
|---|---:|---:|---:|
| Stage passes + full pass | 4,600 | 43,750 | 202,500 |
| Ligas premium | 2,200 | 15,000 | 55,000 |
| Sponsors | 7,500 | 35,000 | 120,000 |
| Merchandising digital | 800 | 5,000 | 18,000 |
| Ritual premium / uplift bundle | 0 - 1,500 | 6,000 | 22,000 |
| **Total estimado** | **15,100 - 16,600** | **104,750** | **417,500** |

## 7.3 Lectura ejecutiva

- **Conservador**: cubre operacion y valida willingness to pay.
- **Base**: ya justifica el modelo como negocio evento-serio.
- **Optimista**: convierte Oraculo Society en franquicia, no solo proyecto Mundial.

## 7.4 Nota importante

La mayor palanca no es subir precios; es mejorar:

- conversion desde ligas privadas
- bundle take rate
- sponsor fill rate
- retencion de usuarios gratis hasta el momento de pago

---

## 8. Prize pool recomendado

## 8.1 Principio rector

El premio debe ser importante, pero **no el centro del discurso**. El mensaje correcto es:

> compite con tus amigos, sobrevive, presume, sube en el ranking y ademas hay premios.

No:

> paga para apostar y ganar dinero.

## 8.2 Estructura recomendada

### Free pools

- premios sponsor-funded
- merch digital
- badges
- accesos premium
- premios fisicos ligeros

### Paid pools

Recomendacion:

- destinar **30% - 35% del revenue neto de passes** a premios
- sumar **20% - 30% del sponsor money** a amplificacion del pool

## 8.3 Distribucion de premios sugerida

### A nivel macro

| Bolsa total de premios | Reparto sugerido |
|---|---:|
| Picks | 35% |
| Knockout | 15% |
| Survivor | 35% |
| Friends/Creator/League boosts | 15% |

### A nivel interno de cada bolsa

| Posicion | Reparto |
|---|---:|
| 1er lugar | 35% |
| 2do lugar | 20% |
| 3er lugar | 10% |
| Top 10 | 20% |
| Liga/creator draws/perks | 15% |

## 8.4 Ligas privadas

### Ligas free

- sin cash obligatorio
- si hay premio, que sea sponsor-funded o definido fuera de plataforma

### Ligas premium

- se puede habilitar “liga destacada”
- perks de sponsor
- recaps premium
- premios no monetarios o cash solo donde el marco legal lo permita

## 8.5 Recomendacion legal/comercial

Si hay mercados sensibles:

- mantener el acceso base free
- usar premios patrocinados
- no presentar el pago como “entry fee para apostar”
- presentar el pago como **premium access** y **enhanced competition layer**

---

## 9. Estrategia de conversion

## 9.1 Free a paid sin agresividad

El objetivo no es meter un paywall temprano; es dejar que el usuario:

1. entre gratis
2. cree o se una a una liga
3. haga sus primeros picks
4. sienta comparacion social
5. vea que premium mejora su experiencia

## 9.2 Momentos clave de conversion

### Momento 1 · Creacion de liga

Trigger:

- “Haz tu liga con amigos”

Upsell:

- League Pro
- recap premium
- branding

### Momento 2 · Antes del cierre de la primera ventana

Trigger:

- el usuario ya entendio el juego

Upsell:

- Picks Pass o Survivor Pass
- ORACULO avanzado

### Momento 3 · Despues de una sorpresa o eliminacion masiva

Trigger:

- aumenta drama y FOMO

Upsell:

- Survivor Pass
- Full Pass
- Knockout Pass para reenganchar eliminados

### Momento 4 · Inicio de eliminatorias

Trigger:

- gente que no quiso comprometerse desde grupos

Upsell:

- Knockout Pass
- Full Pass last call

## 9.3 Copy y framing recomendados

### Framing principal

- “Juega gratis con tus amigos”
- “Compite en serio si quieres desbloquear la capa premium”
- “Mas analisis, mas comparacion, mejores premios”

### Framing a evitar

- “Paga para entrar”
- “Apuesta tu lectura”
- “Multiplica tu premio”

### Copy sugerido

- **Entrar gratis**
- **Crear liga privada**
- **Activa el pase y compite en serio**
- **Desbloquea ORACULO avanzado**
- **Tu liga ya esta jugando; no te quedes en la version basica**

## 9.4 Referral incentives

Recomendacion: incentivos **sociales y de status**, no cash.

- badge Founder League
- recap premium gratis para la liga al llegar a X miembros
- unlock temporal de Ritual premium
- sorteo sponsor-funded
- avatar/badge especial por invitar amigos

No recomendar:

- saldo
- cashback complejo
- wallet credits

Eso complica pagos sin aportar suficiente valor al lanzamiento.

---

## 10. Recomendaciones operativas por sub-marca

## 10.1 Que monetizar ya

- Picks Pass
- Knockout Pass
- Survivor Pass
- Full Pass
- League Pro / Creator / Brand

## 10.2 Que dejar como feature de valor, no como SKU

- Oraculo AI premium
- Ritual premium
- cosmetics

## 10.3 Que no monetizar aun

- Oraculo League como producto principal
- fees por miembro
- add-ons complejos
- marketplace de ligas

---

## 11. Propuesta final de pricing a aprobar

### SKU core

| SKU | Precio aprobado recomendado |
|---|---:|
| Picks Pass Early / Standard / Last Call | 7.99 / 9.99 / 12.99 |
| Knockout Pass Early / Standard / Last Call | 4.99 / 5.99 / 7.99 |
| Survivor Pass Early / Standard / Last Call | 11.99 / 14.99 / 17.99 |
| Full Pass Early / Standard / Last Call | 18.99 / 24.99 / 29.99 |
| League Pro | 24.99 |
| League Creator | 79 |
| League Brand | 499+ |

### Recomendacion del founder-friendly rollout

1. abrir waitlist con **Full Pass Early Bird**
2. vender **Picks Pass** antes del 11 de junio
3. usar **Survivor Pass** como producto flagship de tension emocional
4. abrir **Knockout Pass** al acercarse eliminatorias
5. vender **League Pro** solo al creador, con copy “arma tu mesa premium entre amigos”

---

## 12. Tabla resumen

| Feature | Free | Etapa 1 Picks | Etapa 2 Knockout | Etapa 3 Survivor | Pase Completo |
|---|---|---|---|---|---|
| Registro y onboarding | Si | Si | Si | Si | Si |
| Crear / unirse a ligas basicas | Si | Si | Si | Si | Si |
| Oraculo Picks base | Si | Si | No prioritario | No prioritario | Si |
| Oraculo Picks premium | No | Si | No | No | Si |
| Oraculo Knockout base | Si limitado | No | Si | No | Si |
| Oraculo Knockout premium | No | No | Si | No | Si |
| Oraculo Survivor base | Si | No | No | Si | Si |
| Oraculo Survivor premium | No | No | No | Si | Si |
| Oraculo AI publico | Si | Si | Si | Si | Si |
| Oraculo AI avanzado | No | Si | Si | Si | Si |
| Ritual basico | Si | Si | Si | Si | Si |
| Ritual premium | No | Limitado | Limitado | Limitado | Si |
| Elegibilidad a premios premium | No | Si | Si | Si | Si |
| Badges premium | No | Si | Si | Si | Si |
| Comparativas avanzadas | No | Si | Si | Si | Si |
| Planner / escenarios | No | Parcial | Parcial | Si | Si |
| League analytics / multi-admin | No | No | No | No | Solo via League Pro |

---

## 13. Recomendacion final

La mejor propuesta para Oraculo Society en este ciclo no es “cobrar entrada”, sino:

- **producto base gratis**
- **premium por etapa**
- **bundle claro**
- **ligas premium opcionales**
- **sponsor-backed prize pool**
- **Ritual/AI como valor diferencial**

Si el objetivo es llegar fuerte al 11 de junio, la jugada correcta es:

1. maximizar adquisicion con free
2. convertir a pago desde dinamica social
3. usar Survivor como SKU premium ancla
4. usar Full Pass como opcion de mayor ARPPU
5. monetizar organizadores en vez de frenar a sus amigos

En una frase:

> **Oraculo Society debe monetizar la seriedad competitiva y la coordinacion social, no la probabilidad de ganar.**