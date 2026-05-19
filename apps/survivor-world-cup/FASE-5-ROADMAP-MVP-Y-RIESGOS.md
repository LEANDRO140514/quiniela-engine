# FASE 5 · ROADMAP MVP DETALLADO Y ANÁLISIS DE RIESGOS

## Oraculo Survivor

**Estado del documento:** propuesta ejecutiva para discusión con founder.  
**Objetivo:** definir una hoja de ruta realista para llegar a tiempo al Mundial 2026 con un MVP jugable, monetizable y operable en vivo sin sobrediseñar el producto.  
**Supuesto de planificación:** equipo núcleo de **1-2 developers full-stack**, apoyo parcial de founder, legal externo puntual y operación manual asistida en beta/pre-launch.

---

## 1. Resumen ejecutivo

La conclusión principal es directa: **Oraculo Survivor sí puede llegar al Mundial 2026**, pero solo si se trata como un lanzamiento de evento en tiempo real y no como una plataforma “completa” desde el día 1. Con 1-2 devs, el plan razonable no es perseguir amplitud funcional, sino asegurar cinco cosas:

1. **core competitivo impecable**;
2. **operación confiable durante ventanas y settlements**;
3. **onboarding y pick flow extremadamente claros**;
4. **retención post-eliminación mediante Spectator Mode + IRIS**;
5. **monetización acotada y jurídicamente controlada**.

La recomendación es trabajar con una ruta de **25 semanas de construcción efectiva + 6 semanas de buffer y hardening**, iniciando **no más tarde que la semana del 30 de octubre de 2025 (T-32)**.

### Recomendación ejecutiva

- **MVP mínimo jugable:** al cierre de **Fase B**.
- **Beta cerrada:** al cierre de **Fase C**.
- **Launch público:** al cierre de **Fase E**, con buffer operativo antes del 11 de junio de 2026.
- **Feature freeze:** **30 de abril de 2026 (T-6)**.
- **Buffer operativo recomendado:** **4 a 6 semanas** antes del partido inaugural.

### Principio de priorización

Si hay que elegir entre una feature vistosa y una operación confiable, se sacrifica la feature. En Oraculo Survivor, un error en picks, vidas, cierre de ventana o settlement destruye confianza más rápido de lo que cualquier feature premium la puede construir.

---

## 2. Supuestos de trabajo y criterios de realidad

Para evitar un roadmap fantasioso, este documento asume:

- no habrá app nativa en MVP; solo **PWA**;
- el backend será **modular monolith** con workers, no microservicios;
- **PostgreSQL** será la fuente de verdad;
- **SSE** cubrirá la necesidad realtime principal;
- **Telegram** será el canal de retorno diario más importante;
- **ORÁCULO** en MVP será útil pero no exhaustivo;
- **Premium** se lanzará solo donde legal/compliance y payments estén controlados;
- el equipo aceptará **operación manual asistida** para contingencias en beta y primeras semanas;
- no se intentará resolver compliance global “sobre la marcha”.

---

## 3. Roadmap MVP detallado

## 3.1 Vista general de secuencia

El orden correcto no es “frontend bonito primero” ni “premium primero”. El orden correcto es:

**A. Foundations → B. Competitive Core → C. ORÁCULO + IRIS → D. Premium + Leagues → E. Scale Hardening**

Ese orden respeta la dependencia real del producto:

- sin A no hay base transaccional;
- sin B no hay juego;
- sin C no hay retención ni narrativa;
- sin D no hay monetización seria;
- sin E no hay confianza para operar en vivo.

---

## 3.2 Fase A · Foundations

**Duración estimada:** 5 semanas  
**Ventana sugerida:** 30 oct 2025 - 4 dic 2025  
**Objetivo:** dejar lista la base técnica y de datos para que el juego exista de verdad y no como prototipo frágil.

### Entregables concretos

- app web/PWA inicial con navegación base y layout mobile-first;
- API base en Node.js + Express + TypeScript;
- integración de autenticación con Supabase Auth;
- modelo de datos inicial para:
  - usuarios,
  - torneo,
  - fases,
  - ventanas,
  - equipos,
  - partidos,
  - entries,
  - picks,
  - used teams,
  - lives history,
  - audit log;
- panel mínimo interno para cargar/configurar torneo y ventanas;
- adapter interno para proveedor de data de fútbol;
- ATLAS mínimo con:
  - validación de pick,
  - lock de ventana,
  - settlement básico,
  - trazabilidad de eventos;
- countdown de ventana calculado por servidor;
- base de observabilidad mínima:
  - logs estructurados,
  - error tracking,
  - métricas técnicas básicas.

### Dependencias

- No depende de otras fases.
- Sí depende de definir antes de la semana 1:
  - reglas oficiales congeladas,
  - spec de ventanas,
  - proveedor de auth,
  - proveedor inicial de data de fútbol.

### Criterios de completitud

- un usuario puede registrarse e iniciar sesión;
- el torneo puede configurarse desde backoffice básico;
- existe una ventana abierta de prueba con equipos y partidos reales/cargados;
- un usuario puede registrar un pick válido;
- el servidor puede bloquear la ventana por tiempo;
- el sistema puede liquidar un pick de prueba sin intervención manual en base de datos;
- cada cambio crítico deja rastro en audit log.

### Riesgos específicos de la fase

- subestimar el modelado de torneo y luego tener migraciones dolorosas;
- acoplar ATLAS al schema del proveedor externo;
- dejar la lógica de lock demasiado dependiente del cliente;
- construir sin tooling de observabilidad desde el inicio;
- retrasar decisiones de auth y backoffice, bloqueando fases posteriores.

---

## 3.3 Fase B · Competitive Core

**Duración estimada:** 6 semanas  
**Ventana sugerida:** 5 dic 2025 - 15 ene 2026  
**Objetivo:** convertir el backend base en un juego jugable de punta a punta.

### Entregables concretos

- sistema completo de **Survivor 2+1**:
  - 3 vidas,
  - vida bonus configurable,
  - una selección por ventana,
  - no repetición de equipo;
- entries de torneo;
- historial de picks y equipos usados;
- dashboard del jugador con:
  - vidas,
  - pick actual,
  - tiempo restante,
  - historial,
  - estado competitivo;
- pantalla de pick robusta con validaciones reales;
- leaderboard global básico;
- leaderboard de liga básico;
- Spectator Mode inicial para eliminados;
- pantalla de resultado de pick;
- pantalla de eliminación;
- share básico de estado competitivo;
- reglas visibles/contextuales en momentos críticos;
- recalculo incremental de leaderboard por settlement.

### Dependencias

- Depende de Fase A completa.
- Requiere fixture suficientemente estable para simular ventanas reales.

### Criterios de completitud

- un usuario puede entrar al torneo, hacer pick y atravesar al menos 3 ventanas simuladas;
- el sistema aplica correctamente vidas perdidas y vida bonus;
- no es posible repetir equipo si la regla lo impide;
- el leaderboard refleja resultados sin corrupción de estado;
- un usuario eliminado conserva acceso como espectador;
- los principales edge cases reglamentarios ya tienen comportamiento definido en producto y backend;
- demo cerrada interna del torneo completo funciona sin tocar la base a mano.

### Riesgos específicos de la fase

- errores de lógica en vidas y no repetición;
- ambigüedad UX sobre qué cuenta como pick ganador en eliminatorias;
- performance deficiente al recalcular leaderboards;
- caída de engagement por eliminación temprana sin Spectator suficientemente útil;
- demasiada complejidad visual en el dashboard para un juego que debe ser simple.

### Hito asociado

**MVP mínimo jugable** al finalizar Fase B.  
Si esta fase no está sólida, no tiene sentido acelerar ORÁCULO, Telegram o Premium.

---

## 3.4 Fase C · ORÁCULO + IRIS

**Duración estimada:** 5 semanas  
**Ventana sugerida:** 16 ene 2026 - 19 feb 2026  
**Objetivo:** agregar la capa de inteligencia y retorno diario que transforma el juego en hábito, no solo en mecánica.

### Entregables concretos

- pipeline de ingesta de data del proveedor externo;
- normalización de fixtures, resultados y contexto de partido;
- ORÁCULO básico transversal en:
  - pantalla de pick,
  - dashboard,
  - recap,
  - estados premium teaser;
- scores simples de confianza/riesgo/volatilidad;
- disclaimers operativos para ORÁCULO;
- bot de Telegram con:
  - linking de cuenta,
  - opt-in de notificaciones,
  - recordatorios 24h / 6h / 1h / last-call,
  - confirmación de pick,
  - resultado de pick,
  - recap básico,
  - mensaje de eliminación;
- preferencias básicas de notificación;
- jobs de scheduling para mensajes por ventana;
- rate limiting y control básico de frecuencia de mensajes;
- fallback a email o web notification para casos mínimos si Telegram falla.

### Dependencias

- Depende de Fase B para saber qué mensajes y estados producir.
- Depende de adapter de data y modelo de matches de Fase A.

### Criterios de completitud

- ORÁCULO devuelve insights consistentes para una ventana real o simulada;
- los recordatorios de Telegram se envían a cohorts de prueba en tiempo correcto;
- un usuario puede vincular Telegram sin fricción mayor;
- los eventos críticos del juego disparan mensajes correctos;
- la app conserva funcionalidad principal aunque ORÁCULO no responda;
- los mensajes no se duplican ante reintentos.

### Riesgos específicos de la fase

- convertir ORÁCULO en una capa demasiado compleja para el tiempo disponible;
- prometer más precisión de la que realmente puede sostenerse;
- enviar demasiados mensajes y generar fatiga;
- depender de Telegram como si fuera infraestructura propia;
- introducir acoplamiento entre recomendaciones y registro de picks.

### Hito asociado

**Beta cerrada** al finalizar Fase C.  
En este punto el producto ya debe poder ponerse en manos de una cohorte controlada con experiencia razonablemente completa.

---

## 3.5 Fase D · Premium + Leagues

**Duración estimada:** 4 semanas  
**Ventana sugerida:** 20 feb 2026 - 19 mar 2026  
**Objetivo:** habilitar monetización controlada y distribución social de alto valor.

### Entregables concretos

- integración de Stripe para cobro del Premium Tournament Pass;
- modelo de entitlements desacoplado del proveedor de pagos;
- upgrade premium dentro de la app;
- gating contextual de features premium;
- ORÁCULO premium acotado:
  - mayor profundidad comparativa,
  - mejores insights por ventana,
  - lectura estratégica adicional;
- private leagues básicas completas;
- creator/pro leagues en versión MVP:
  - creación,
  - invitación,
  - ranking propio,
  - branding liviano;
- flujo de upgrade desde liga o dashboard;
- webhooks de pago, reconciliación simple y estado de compra;
- refund/cancel flow básico para casos operativos;
- copy y disclaimers diferenciando juego competitivo vs percepción de betting.

### Dependencias

- Depende de Fase B para el core del juego.
- Se beneficia de Fase C para mejores triggers de conversión y retención.
- Requiere insumos legales mínimos antes de abrir paid flows.

### Criterios de completitud

- un usuario elegible puede pagar y recibir entitlement correcto;
- el producto se comporta correctamente si Stripe tarda, falla o reintenta webhook;
- el paywall premium no rompe fairness ni flujos free;
- una creator league puede crearse e invitar usuarios reales;
- los límites entre free y premium son claros en UX y negocio;
- existe trazabilidad básica para soporte de pagos.

### Riesgos específicos de la fase

- bloqueo de Stripe por percepción de gambling;
- iniciar monetización sin matriz legal por país;
- exceso de ambición en league tooling para el tiempo disponible;
- crear un premium demasiado débil para convertir o demasiado agresivo para fairness;
- crecimiento de soporte por disputas de cobro y acceso.

---

## 3.6 Fase E · Scale Hardening

**Duración estimada:** 5 semanas  
**Ventana sugerida:** 20 mar 2026 - 23 abr 2026  
**Objetivo:** convertir un producto funcional en una operación confiable para evento global en vivo.

### Entregables concretos

- reconciliation jobs para corrección de resultados y settlements;
- rollback compensatorio de vidas/resultados con event log;
- admin console mínima para:
  - override de partido,
  - reintento de settlement,
  - revisión de usuario,
  - soporte de pagos,
  - gestión de incidencias;
- dashboards de observabilidad:
  - API,
  - base de datos,
  - colas,
  - jobs,
  - Telegram delivery,
  - pagos;
- alertas operativas por SLA y por eventos de torneo;
- stress tests de:
  - cierre de ventana,
  - settlement masivo,
  - leaderboard updates,
  - envío de notificaciones;
- estrategia de caché y degradación controlada;
- backups verificados y procedimiento de restore;
- runbooks de torneo en vivo;
- simulacros operativos end-to-end;
- checklist de go/no-go por ventana;
- plan de soporte on-call y escalamiento.

### Dependencias

- Depende de A-D.
- No debe iniciarse cuando “sobre tiempo”; debe estar en roadmap desde el principio.

### Criterios de completitud

- el equipo puede corregir un settlement erróneo sin tocar registros manualmente;
- existe visibilidad casi en tiempo real del estado de la plataforma;
- se completó al menos un game day rehearsal con tráfico y operaciones simuladas;
- hay capacidad documentada para operar una caída de proveedor externo;
- los backups y restores fueron probados;
- existe decisión clara de qué se degrada primero bajo pico.

### Riesgos específicos de la fase

- dejar hardening para el final y no tener tiempo real para probarlo;
- ausencia de admin tooling que fuerce cambios manuales peligrosos;
- creer que “si pasó en staging, pasará en producción”;
- no ensayar incidentes antes del Mundial;
- subestimar la necesidad de comunicación operacional al usuario.

### Hito asociado

**Fin de construcción principal** al finalizar Fase E.  
Desde aquí, el foco debe moverse a congelar scope, corregir bugs críticos, cargar datos definitivos, probar y operar pre-launch.

---

## 4. Timeline visual, hitos y fechas objetivo

## 4.1 Timeline ASCII

```text
Mundial 2026 inicia: 11 Jun 2026

2025                                              2026
Oct     Nov     Dec     Jan     Feb     Mar     Apr     May     Jun
|-------|-------|-------|-------|-------|-------|-------|-------|------->

A: Foundations        [=====]
B: Competitive Core         [======]
C: ORÁCULO + IRIS                   [=====]
D: Premium + Leagues                        [====]
E: Scale Hardening                               [=====]

Beta cerrada                                              [##]
Feature freeze                                                 ^
Public launch                                                    [###]
Buffer operativo                                                      [====]
Primer partido Mundial                                                     *

Leyenda:
[=====] fase principal
[##] beta cerrada
[###] launch público
^ feature freeze
* 11 Jun 2026
```

## 4.2 Fechas recomendadas

| Hito | Fecha objetivo | Relación con Mundial | Comentario |
|---|---:|---:|---|
| Inicio del roadmap | 30 oct 2025 | T-32 semanas | Más tarde que esto eleva riesgo de forma seria |
| Fase A lista | 4 dic 2025 | T-27 | Base transaccional y ATLAS mínimo |
| Fase B lista | 15 ene 2026 | T-21 | **MVP mínimo jugable** |
| Fase C lista | 19 feb 2026 | T-16 | **Beta cerrada** |
| Fase D lista | 19 mar 2026 | T-12 | Monetización y ligas listas |
| Fase E lista | 23 abr 2026 | T-7 | Hardening principal completado |
| Feature freeze | 30 abr 2026 | T-6 | Desde aquí solo bugs, datos, performance, compliance y polish |
| Launch público | 14 may 2026 | T-4 | Tiempo suficiente para onboarding y creación de ligas |
| Buffer operativo | 14 may - 10 jun 2026 | T-4 a T-0 | Carga final, dry runs, soporte y observación |
| Mundial 2026 | 11 jun 2026 | T-0 | Primer cierre real se vuelve evento crítico |

## 4.3 Milestones críticos

### 1) MVP mínimo jugable

**Cuándo:** al final de Fase B  
**Qué significa:** un usuario puede entrar, elegir, sobrevivir o ser eliminado, ver su estado y rankearse.  
**Por qué importa:** si eso no existe en enero de 2026, el proyecto ya está tarde.

### 2) Beta cerrada

**Cuándo:** al final de Fase C  
**Qué significa:** cohortes reales pueden probar flujo completo con reminders, ORÁCULO básico y Spectator.  
**Por qué importa:** aquí empiezan a aparecer los bugs de producto real, no solo de lógica técnica.

### 3) Launch público

**Cuándo:** 14 may 2026  
**Qué significa:** waitlist abierta, creator leagues visibles, Premium activo donde aplique, Telegram bot funcionando, datos iniciales cargados.  
**Por qué importa:** lanzar demasiado cerca del Mundial reduce adquisición, formación de ligas y tiempo de soporte.

## 4.4 Feature freeze

**Fecha recomendada:** **30 de abril de 2026 (T-6)**.

Después de esa fecha:

- no se agregan modos nuevos;
- no se rediseña monetización;
- no se reestructura arquitectura;
- no se aceptan “quick wins” que toquen el core;
- solo entran:
  - bugs P0/P1,
  - performance,
  - observabilidad,
  - datos,
  - copy legal,
  - polish de onboarding y pick flow.

## 4.5 Buffer recomendado antes del Mundial

**Recomendación:** mínimo **4 semanas**, ideal **6 semanas**.

Ese buffer debe usarse para:

- pruebas con datos reales;
- carga del calendario final;
- ensayos de incidentes;
- verificación de flujos de pago;
- tuning de notificaciones;
- revisión legal y regional;
- soporte a creators y primeras ligas.

Sin buffer, el equipo llega “funcional” pero no “operable”.

---

## 5. Qué se sacrifica si el tiempo aprieta

La regla de sacrificio debe ser secuencial, no emocional.

### Nunca sacrificar antes que el core

No se deben sacrificar:

- precisión del lock de ventana;
- consistencia de picks, vidas y settlement;
- leaderboard confiable;
- Spectator Mode mínimo;
- observabilidad mínima;
- plan de contingencia;
- compliance mínimo;
- Telegram reminders esenciales.

### Primer bloque sacrificable

Si el tiempo aprieta, se postergan primero:

- ORÁCULO premium avanzado;
- creator league branding ampliado;
- share cards avanzadas;
- analytics premium profundas;
- personalización compleja de perfil;
- email lifecycle sofisticado;
- experiencias de sponsor ricas.

### Segundo bloque sacrificable

Si el tiempo sigue apretando, se reduce:

- League Pro avanzada, quedando solo ligas básicas + creator MVP;
- refund automation sofisticada;
- dashboards analíticos internos no críticos;
- social activity feed compleja;
- recaps enriquecidos.

### Último recurso

Si a **T-12** o **T-10** el proyecto sigue atrasado, se recorta alcance comercial:

- lanzar **Free + Premium Pass simple**;
- mantener creator leagues básicas;
- dejar Brand leagues y B2B más complejas post-launch;
- limitar países monetizados;
- operar más procesos manualmente, pero documentados.

---

## 6. Matriz de riesgos completa

## 6.1 Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación concreta | Owner sugerido |
|---|---|---|---|---|
| Avalancha de picks en los últimos minutos de cierre | Alta | Crítico | Endpoint de pick mínimo e idempotente, hard close en servidor, caché de metadata, pruebas de carga específicas de cierre | Dev |
| Dependencia excesiva de la API de fútbol | Alta | Alto | Adapter interno, payload bruto + normalizado, caché local, proveedor secundario/manual fallback, settlement desacoplado de ORÁCULO | Dev |
| Bug en settlement descuenta vidas incorrectas | Media | Crítico | Event log, reconciliation jobs, compensating events, snapshots previos a settlement, doble validación en staging | Dev |
| Leaderboard lento o inconsistente bajo carga | Media | Alto | Snapshots base + updates incrementales, caché por torneo/ventana/liga, evitar full recompute constante | Dev |
| Duplicación por reintentos de jobs/webhooks | Media | Alto | Idempotency keys, estados transaccionales, locks distribuidos y deduplicación en colas | Dev |
| Falla de SSE/realtime durante partidos | Media | Medio | Modo degradado con polling espaciado, estados cacheados y UI explícita de “última actualización” | Dev |
| Pérdida de visibilidad operacional en producción | Media | Alto | Logs estructurados, métricas, alertas por cola/API/DB, dashboards listos antes de launch | Dev/Ops |
| Backups no restaurables en incidente real | Baja | Crítico | Probar restore completo antes de launch y repetir simulacro durante buffer | Ops |

## 6.2 Riesgos de producto

| Riesgo | Probabilidad | Impacto | Mitigación concreta | Owner sugerido |
|---|---|---|---|---|
| Usuarios no entienden la mecánica en 30 segundos | Media | Alto | Landing y onboarding en 3-5 pasos, reglas embebidas en pick flow, copy extremadamente simple | Founder/Product |
| Eliminación temprana produce churn fuerte | Alta | Alto | Spectator Mode desde día 1, recaps, narrativa social, ligas activas y mensajes de reenganche por IRIS | Founder/Product |
| ORÁCULO se percibe como “promesa de acierto” | Media | Alto | Disclaimers visibles, tono analítico no tipster, insights relativos y no lenguaje de certeza | Founder/Product |
| UX de pick genera miedo o fricción | Media | Alto | Pantalla de pick robusta, guardrails de validación y feedback de riesgo claro | Product/Dev |
| Telegram se vuelve spam | Media | Medio | Preferencias de frecuencia, caps de envío, segmentación por estado del jugador | Product/Ops |
| Premium no convierte por poca diferencia percibida | Media | Alto | Gating contextual, valor claro en ORÁCULO y ligas premium, pricing disciplinado y creator-led conversion | Founder/Product |

## 6.3 Riesgos legales y regulatorios

| Riesgo | Probabilidad | Impacto | Mitigación concreta | Owner sugerido |
|---|---|---|---|---|
| Clasificación o percepción de gambling en ciertos mercados | Alta | Crítico | Separar free global de paid jurisdictions, revisión legal por país, evitar odds/cuotas/lenguaje betting, age gate y prize terms | Legal/Founder |
| Stripe rechaza onboarding por percepción de gambling | Media | Crítico | Presentación clara del negocio, documentación legal, separar entitlements de processor, plan alterno free-only temporal | Founder/Legal |
| Riesgo marcario por “World Cup” o apariencia de afiliación oficial | Media | Alto | Trademark clearance, naming review, disclaimers de no afiliación, cero uso de assets oficiales protegidos | Legal/Founder |
| Incumplimiento GDPR/privacy en operación global | Media | Alto | Privacy policy, consentimiento granular, minimización de datos, DPA con proveedores, borrado/export de datos | Legal/Dev |
| Age gate insuficiente para paid flows | Media | Alto | 18+ para experiencias pagadas, reglas por jurisdicción y verificación adicional donde aplique | Legal/Product |
| Prize compliance y KYC mal resueltos | Media | Alto | Elegibilidad clara, tax/KYC/sanctions cuando corresponda, limitar premios o jurisdicciones si no está listo | Legal/Ops |
| Uso de data deportiva sin licencia/compliance suficiente | Media | Alto | Revisar términos del proveedor, límites de redistribución, cobertura territorial y uso comercial permitido | Legal/Founder |

## 6.4 Riesgos operacionales

| Riesgo | Probabilidad | Impacto | Mitigación concreta | Owner sugerido |
|---|---|---|---|---|
| Resultado de partido incorrecto ingestado o corregido tarde | Media | Crítico | Validación cruzada, data_version, reconciliation job y comunicación transparente a usuarios afectados | Ops/Dev |
| Downtime durante cierre de ventana o settlement | Media | Crítico | Runbooks, autoscaling/capacidad reservada, modo degradado y on-call durante eventos de alto riesgo | Ops/Dev |
| Error humano en configuración de ventanas o partidos | Media | Alto | Backoffice con validaciones, doble revisión y checklist de publicación | Ops |
| Telegram Bot API rate-limited o degradado | Media | Medio | Colas, retry policy, caps, fallback a in-app/email, priorización de mensajes críticos | Ops/Dev |
| Soporte saturado durante launch y primeras ventanas | Alta | Medio | Macros, centro de ayuda, runbooks, ownership claro de incidentes y soporte creator-first | Ops |
| No tener calendario final/cargado a tiempo | Baja | Alto | Carga preliminar + actualización controlada, freeze de datos antes del launch público | Ops |

## 6.5 Riesgos de mercado

| Riesgo | Probabilidad | Impacto | Mitigación concreta | Owner sugerido |
|---|---|---|---|---|
| Saturación de productos alrededor del Mundial | Alta | Alto | Posicionamiento ultra claro, creator distribution, private leagues desde día 1, mensaje anti-fantasy/anti-betting | Founder |
| Llegar tarde y perder ventana de adquisición | Alta | Crítico | Public launch mínimo T-4, feature freeze T-6, recorte de scope anticipado en T-12 si hay atraso | Founder/Dev |
| Mensaje confuso frente a fantasy o apuestas | Media | Alto | Storytelling unificado, manual de brand language, landing y ads simples | Founder/Marketing |
| Competidor mejor financiado replica la idea | Media | Medio | Velocidad, ligas creator-led, ORÁCULO como capa distintiva y ejecución enfocada | Founder |

## 6.6 Riesgos de equipo

| Riesgo | Probabilidad | Impacto | Mitigación concreta | Owner sugerido |
|---|---|---|---|---|
| Capacidad insuficiente para 1-2 devs | Alta | Crítico | Scope estricto, recorte temprano, evitar trabajo paralelo innecesario, priorizar reliability sobre breadth | Founder |
| Bus factor extremo en backend o pagos | Alta | Alto | Documentación mínima obligatoria, runbooks, pairing en componentes críticos, ownership explícito | Founder/Dev |
| Gap de expertise en live ops/compliance | Media | Alto | Asesoría externa puntual, playbooks, revisión de terceros en áreas críticas | Founder |
| Ausencia de QA dedicado | Alta | Medio | Beta cerrada disciplinada, test matrix manual, simulacros por ventanas y checklist operativa | Dev/Ops |

## 6.7 Riesgos financieros

| Riesgo | Probabilidad | Impacto | Mitigación concreta | Owner sugerido |
|---|---|---|---|---|
| CAC más alto de lo previsto | Media | Alto | Creator-led acquisition, referral no monetario, ligas privadas como loop orgánico | Founder |
| Conversión a Premium por debajo del plan | Media | Alto | Valor premium claro, last-call pricing, upgrade contextual y prueba social | Founder/Product |
| Dependencia excesiva de sponsors para prize pool | Media | Medio | Diseñar economía que funcione sin sponsor grande, sponsor como upside y no como condición de launch | Founder |
| Costos de data/licencias/compliance comen el margen | Media | Medio | Lanzar con stack pragmático, paid solo en mercados habilitados, evitar sobrecompra temprana de tooling | Founder |
| Chargebacks y fraude afectan caja | Media | Medio | Device/risk controls, soporte claro, documentación de compra y monitoreo de disputas | Ops/Founder |

---

## 7. Plan de contingencia para escenarios críticos

## 7.1 Si la API de fútbol falla durante un partido en vivo

### Objetivo

Proteger la integridad del juego antes que la velocidad aparente.

### Respuesta recomendada

1. **No hacer settlement automático** mientras la data esté incierta.
2. Congelar el estado del partido como **“awaiting verification”**.
3. Activar fuente secundaria o verificación manual por Ops.
4. Mantener visible en producto:
   - partido en revisión,
   - leaderboard provisional si aplica,
   - mensaje explícito de que el resultado aún no impacta vidas.
5. IRIS envía comunicación simple: “resultado en verificación, tus vidas no cambian todavía”.
6. Una vez confirmada la data:
   - ejecutar settlement,
   - regenerar leaderboard,
   - registrar versión de dato.

### Principio operativo

Es mejor demorar un settlement 15-30 minutos que liquidar mal y romper confianza.

---

## 7.2 Si hubo un error en resultados y se descontaron vidas incorrectamente

### Objetivo

Corregir con trazabilidad, sin tocar datos “a mano” ni esconder el incidente.

### Respuesta recomendada

1. Declarar incidente P0.
2. Pausar nuevos settlements relacionados.
3. Marcar match afectado con nueva `data_version`.
4. Ejecutar **reconciliation job** con eventos compensatorios:
   - revertir vida descontada,
   - recalcular estado de entry,
   - recomputar leaderboard.
5. Verificar cohorte impactada.
6. Enviar comunicación transparente a afectados.
7. Publicar postmortem interno con causa raíz, tiempo de detección y acción preventiva.

### Regla no negociable

Nunca hacer updates silenciosos sin audit log.

---

## 7.3 Si no llegamos al MVP para el inicio del Mundial

### Objetivo

Evitar un launch roto por orgullo.

### Umbrales de decisión

- **Si a T-12 no está lista Fase C:** cortar alcance comercial y social avanzado.
- **Si a T-8 no está listo un beta estable:** cancelar features no críticas y concentrarse en Free Core.
- **Si a T-4 el core competitivo no es confiable:** no lanzar paid contest.

### Fallback recomendado

#### Plan B razonable

- lanzar **Free Core + Spectator + Telegram reminders**;
- desactivar monetización donde no esté resuelta;
- operar ligas básicas;
- presentar premium como waitlist o activación posterior;
- reducir países/mercados;
- limitar promesas públicas.

#### Plan C extremo

Si ni siquiera el core de picks/vidas/settlement es estable, no lanzar el torneo real. Lanzar solo:

- waitlist,
- contenido,
- simulador/demo,
- captación para siguiente competencia.

Lanzar roto es peor que no lanzar.

---

## 7.4 Si hay un pico de tráfico 10x mayor al esperado

### Objetivo

Mantener funcional el camino crítico aunque se degraden capas accesorias.

### Orden de degradación recomendado

1. desactivar features decorativas o pesadas;
2. pasar leaderboards a refresh más espaciado;
3. reducir fan-out de SSE y usar caché;
4. pausar generación síncrona de share cards;
5. priorizar endpoint de pick y auth sobre todo lo demás;
6. diferir recaps y notificaciones no críticas;
7. escalar horizontalmente API/workers y subir capacidad temporal de DB/Redis.

### Mensaje de producto

Si se entra en modo degradado, la interfaz debe decirlo con claridad. El usuario perdona lentitud; no perdona incertidumbre sobre si su pick quedó registrado.

---

## 7.5 Si un regulador bloquea la operación en un mercado clave

### Objetivo

Reducir exposición legal sin detener toda la plataforma.

### Respuesta recomendada

1. Geoblock inmediato del flujo pago afectado.
2. Mantener acceso free si la revisión legal lo permite.
3. Suspender campañas y creators en ese mercado.
4. Ajustar términos y disclaimers.
5. Evaluar si el mercado pasa a:
   - free-only,
   - waitlist,
   - salida temporal.
6. Comunicar sin lenguaje ambiguo.

### Principio

La arquitectura comercial debe tolerar mercados con reglas distintas. No se diseña como operación única global.

---

## 7.6 Si Stripe rechaza la cuenta por percepción de gambling

### Objetivo

Que un rechazo del procesador no mate el launch completo.

### Respuesta recomendada

1. Separar desde el diseño:
   - acceso premium,
   - contest,
   - premios,
   - processor;
2. relanzar presentación comercial y legal de la plataforma;
3. suspender temporalmente paid flows;
4. lanzar modo **free-first** en los mercados permitidos;
5. sostener crecimiento vía ligas, creators y sponsor-led activations;
6. evaluar procesador alterno o merchant-of-record solo si la estructura legal lo soporta.

### Principio

No acoplar la supervivencia del producto a una sola cuenta de Stripe.

---

## 8. Checklist pre-launch

## 8.1 Técnico

- [ ] producción, staging y dev separados
- [ ] variables y secretos gestionados correctamente
- [ ] backups automáticos verificados
- [ ] restore test ejecutado con éxito
- [ ] dashboards de API, DB, Redis, jobs y errores activos
- [ ] alertas P0/P1 configuradas
- [ ] endpoint de pick probado bajo carga
- [ ] stress test de lock de ventana ejecutado
- [ ] stress test de settlement ejecutado
- [ ] estrategia de caché validada
- [ ] modo degradado definido
- [ ] rollback compensatorio documentado
- [ ] admin console mínima operativa
- [ ] logging estructurado y correlación por request/job

## 8.2 Legal

- [ ] Terms of Service aprobados
- [ ] Privacy Policy aprobada
- [ ] Official Rules / Competition Rules publicadas
- [ ] age gate implementado
- [ ] disclaimers de no afiliación oficial visibles
- [ ] matriz de jurisdicciones cerrada
- [ ] prize terms listos
- [ ] refund policy lista
- [ ] revisión de trademark/naming completada
- [ ] compliance del proveedor de data validado
- [ ] creator/affiliate guidelines publicadas

## 8.3 Operacional

- [ ] runbooks de incidentes redactados
- [ ] on-call schedule definido
- [ ] escalamiento founder/dev/ops claro
- [ ] owner por ventana de torneo asignado
- [ ] playbook para caída de API externa
- [ ] playbook para settlement incorrecto
- [ ] playbook para caída de Telegram
- [ ] soporte macros/FAQ preparado
- [ ] simulacro de game day completado

## 8.4 Producto

- [ ] landing clara y pública
- [ ] onboarding testado con usuarios nuevos
- [ ] pick flow validado end-to-end
- [ ] dashboard y estado de vidas correctos
- [ ] Spectator Mode activo
- [ ] share básico funcionando
- [ ] ORÁCULO con disclaimers correctos
- [ ] upgrade premium visible pero no intrusivo
- [ ] errores y estados vacíos bien resueltos
- [ ] mensajes críticos revisados por producto/founder

## 8.5 Marketing

- [ ] landing live con waitlist/registro
- [ ] creator leagues iniciales creadas
- [ ] assets de lanzamiento listos
- [ ] manual de brand language distribuido
- [ ] campaña de pre-launch lista
- [ ] campaña de launch lista
- [ ] premium early bird definido
- [ ] Telegram bot activo y público
- [ ] canales sociales y enlaces de share verificados

## 8.6 Datos

- [ ] calendario del Mundial cargado
- [ ] equipos verificados
- [ ] ventanas configuradas
- [ ] horarios y zonas validados
- [ ] mapping de IDs del proveedor externo probado
- [ ] API de resultados testeada con partidos reales/históricos
- [ ] escenarios de partido suspendido/reprogramado simulados
- [ ] política de corrección de resultados documentada

---

## 9. Prioridades de sacrificio si el tiempo aprieta

## 9.1 Must-have absoluto

Sin esto, **no se lanza**:

1. registro/login estable;
2. configuración correcta del torneo, ventanas, equipos y partidos;
3. pick flow robusto;
4. lock de ventana en servidor;
5. settlement confiable;
6. vidas + no repetición + historial correctos;
7. leaderboard básico confiable;
8. Spectator Mode mínimo;
9. Telegram reminders y confirmación de pick;
10. observabilidad mínima;
11. admin/ops tooling mínimo;
12. compliance mínimo:
    - ToS,
    - privacy,
    - age gate,
    - official rules,
    - jurisdicciones pagas definidas.

## 9.2 Should-have

Mejora mucho el producto, pero puedes vivir sin una parte si hace falta:

1. ORÁCULO básico transversal;
2. recap de jornada;
3. creator leagues MVP;
4. Premium Pass con gating contextual;
5. share cards básicas;
6. leaderboard por ligas;
7. pantalla de eliminación bien trabajada;
8. email/push fallback mínimo.

## 9.3 Nice-to-have

Se puede agregar post-launch sin matar el producto:

1. ORÁCULO premium avanzado;
2. creator kits ampliados;
3. branding profundo para brand leagues;
4. share cards avanzadas;
5. analytics premium complejas;
6. badges dinámicos avanzados;
7. social feed rico;
8. dashboards internos no críticos;
9. automatizaciones sofisticadas de soporte/refund;
10. Zombie Mode.

---

## 10. Recomendación final para discusión con founder

La decisión más importante no es técnica; es de disciplina.

Si Oraculo Survivor quiere llegar fuerte al Mundial 2026 con 1-2 devs, debe asumir desde ahora que:

- el éxito del MVP depende más de **claridad, integridad operativa y timing** que de amplitud funcional;
- el roadmap debe tratar **Fase E** como parte del producto, no como “polish”;
- el launch ideal no es el día del primer partido, sino **4 semanas antes**;
- la monetización debe ser agresiva en claridad comercial, pero conservadora en exposición legal;
- cualquier feature que ponga en riesgo picks, vidas, settlements o compliance debe moverse post-launch.

### Recomendación ejecutiva final

**Sí lanzar.**  
Pero lanzar con un criterio duro:

> **Free core impecable + retención social + monetización controlada + operación ensayada.**

Ese es el MVP correcto para llegar vivos al 11 de junio de 2026.
