# FASE 1 · CONCEPTO Y REGLAS

## Oraculo Survivor

**Tagline propuesto:** *Cada ronda importa. Cada pick te acerca o te elimina.*

---

## 1. Resumen ejecutivo

**Oraculo Survivor** es una competencia estratégica de supervivencia construida sobre el Mundial 2026, donde cada usuario debe elegir una selección por jornada o ronda para mantenerse con vida dentro del juego. Si la selección elegida gana, el usuario sobrevive; si empata o pierde, consume una vida. La tensión proviene de tres restricciones simultáneas: vidas limitadas, imposibilidad de repetir selección y necesidad de administrar los equipos fuertes a lo largo de un torneo de hasta ocho partidos para el campeón.

No es una casa de apuestas, ni un sportsbook, ni una promesa de certeza. La propuesta del producto combina tres capas de valor: **inteligencia probabilística**, **competencia estratégica** y **supervivencia emocional**. El jugador no compra un resultado; participa en una experiencia de decisión, riesgo y lectura de contexto.

Este documento presenta una **recomendación principal de modelo**, reglas oficiales base para una primera versión del producto y un marco abierto para discusión con el founder antes de congelar la especificación definitiva.

---

## 2. Concepto completo del producto

### 2.1 Nombre del producto

**Oraculo Survivor**

### 2.2 Tagline definitivo recomendado

**Cada ronda importa. Cada pick te acerca o te elimina.**

Alternativas válidas para debate:

- *Sobrevive al Mundial.*
- *Elige bien. Sobrevive más.*
- *Inteligencia, estrategia y una sola vida por error.*

La recomendación principal es mantener el tagline propuesto porque expresa con claridad:

1. la lógica por rondas;
2. la consecuencia directa de cada decisión;
3. el tono competitivo y emocional del producto.

### 2.3 Elevator pitch

Oraculo Survivor es una competencia de supervivencia basada en el Mundial 2026 donde eliges una selección por jornada o ronda para seguir con vida. Si tu selección gana, avanzas; si empata o pierde, pierdes una vida, y no puedes volver a usar ese equipo en todo el torneo. La diferencia no está en prometer certezas, sino en darte inteligencia probabilística para competir mejor en un juego simple, viral y profundamente estratégico.

### 2.4 Propuesta de valor

La propuesta de valor de Oraculo Survivor se apoya en cinco pilares:

1. **Regla simple de entender, difícil de dominar.**  
   El usuario comprende la mecánica en segundos, pero la profundidad estratégica aparece cuando debe decidir no solo quién puede ganar hoy, sino a quién conviene reservar para más adelante.

2. **Alta tensión con baja fricción.**  
   Un pick por jornada o ronda reduce la carga operativa y convierte cada decisión en un momento relevante.

3. **Inteligencia probabilística sin narrativa de apuesta.**  
   ORÁCULO aporta análisis, probabilidades, contexto y lectura de valor competitivo, no “predicciones garantizadas”.

4. **Competencia social y viralizable.**  
   La supervivencia genera historias naturalmente compartibles: quién sigue vivo, quién cayó por un empate inesperado, quién arriesgó con un underdog y acertó.

5. **Formato global, adaptable y escalable.**  
   El mismo framework conceptual puede extenderse a otros torneos internacionales y propiedades deportivas futuras.

### 2.5 Público objetivo

#### Público primario

- Aficionados al fútbol internacional entre 18 y 44 años.
- Usuarios que disfrutan competir con amigos, comunidades, grupos de Telegram o audiencias de creadores.
- Personas interesadas en juegos de predicción, fantasy ligero, quinielas o pools, pero que prefieren una mecánica más simple y estratégica.

#### Público secundario

- Audiencias casuales del Mundial que no quieren gestionar un fantasy complejo.
- Usuarios que consumen contenido estadístico, probabilístico o de análisis previo a partidos.
- Comunidades digitales hispanohablantes que buscan experiencias grupales de corta duración y alta conversación.

### 2.6 Identidad de producto

Oraculo Survivor debe posicionarse como una experiencia:

- **Global**
- **Competitiva**
- **Simple**
- **Viral**
- **Emocional**
- **Estratégica**

El principio central de comunicación debe permanecer estable:

> **No vendemos certeza. Vendemos inteligencia probabilística + competencia estratégica + supervivencia.**

### 2.7 Diferenciadores frente a fantasy football, apuestas deportivas y quinielas

#### Frente a fantasy football

- No exige gestionar plantillas, presupuesto, capitanes ni múltiples métricas.
- La acción central es una sola decisión de alto impacto.
- La complejidad se desplaza de la administración al timing estratégico.

#### Frente a apuestas deportivas

- No se basa en cuotas, stake, cashout ni promesa de ganancia monetaria por evento.
- La motivación principal es sobrevivir, rankear y competir, no apostar dinero a resultados.
- ORÁCULO se presenta como motor analítico, no como promotor de picks de apuesta.

#### Frente a quinielas tradicionales

- No consiste en llenar una cartilla completa de resultados.
- La restricción de no repetir selección aumenta la profundidad a lo largo del torneo.
- El sistema de vidas introduce tensión progresiva y narrativa de eliminación.

### 2.8 Rol de los agentes del sistema

Para claridad conceptual del producto:

- **ORÁCULO:** inteligencia probabilística y capa de análisis.
- **ATLAS:** motor del juego, picks, vidas, scoring y dashboard.
- **HERMES:** reglas, documentación y consistencia normativa.
- **IRIS:** Telegram, notificaciones y narrativa emocional del juego.

Estos agentes no sustituyen las reglas del producto, pero ayudan a estructurar su narrativa operativa y su arquitectura futura.

---

## 3. Modelos analizados y recomendación

### 3.1 Modelos evaluados

#### A. Survivor 2+1 (original)

**Descripción:**  
Un pick por jornada o ronda. El usuario inicia con 2 vidas base y 1 vida bonus, para un total potencial de 3. No puede repetir selección.

**Ventajas:**

- Mecánica extremadamente simple de comunicar.
- Muy buena adaptación a audiencias masivas y novatas.
- Baja carga operativa por usuario.
- La restricción de no repetir selección funciona muy bien en un torneo largo.
- Mantiene tensión real sin convertir la experiencia en algo complejo.

**Desventajas:**

- Riesgo de eliminación temprana en fase de grupos.
- Para usuarios muy casuales, quedar fuera pronto puede reducir retención.
- Requiere una política clara de bonus o reenganche si se busca mayor engagement.

#### B. Pick'em + Knockout

**Descripción:**  
Fase de grupos como confidence pool sin eliminación. Eliminatorias como Survivor clásico. Clasifica solo una porción de jugadores y las vidas iniciales dependen del desempeño previo.

**Ventajas:**

- Maximiza engagement durante toda la fase de grupos.
- Reduce la frustración de eliminación temprana.
- Genera dos capas de juego: volumen de aciertos y supervivencia.

**Desventajas:**

- Más difícil de explicar y operar.
- Mezcla dos productos diferentes en una sola experiencia.
- Requiere más UX, más scoring y más soporte normativo.
- Puede diluir la identidad principal de “supervivencia simple”.

#### C. Reset Survivor

**Descripción:**  
Mini Survivor en fase de grupos, seguido de reinicio completo de vidas para eliminatorias.

**Ventajas:**

- La segunda etapa da nueva oportunidad y reduce frustración.
- Permite campañas narrativas diferenciadas por fase.
- Acomoda bien la estructura larga del Mundial 2026.

**Desventajas:**

- El reset puede restar peso a las decisiones iniciales.
- Introduce una ruptura conceptual en la promesa de supervivencia continua.
- Requiere explicar dos economías de vidas distintas.

#### D. Underdog Survivor

**Descripción:**  
El usuario elige al equipo que considera que perderá el partido.

**Ventajas:**

- Diferenciación fuerte y potencial viral alto.
- Tono audaz y contracultural.

**Desventajas:**

- Mucho más confuso para nuevos usuarios.
- Riesgo de romper la intuición natural del Mundial como celebración del ganador.
- Menor accesibilidad comercial para MVP masivo.

#### E. Otros formatos analizados

Bracket Survivor, Last Team Standing, Confidence Pool puro y Fantasy Survivor fueron considerados, pero no priorizados para esta fase por una razón principal: o bien incrementan demasiado la complejidad, o bien reducen el componente central de supervivencia pick a pick.

### 3.2 Modelo principal recomendado

## Recomendación principal: Survivor 2+1

Se recomienda que el producto base de **Oraculo Survivor** para el Mundial 2026 sea **Survivor 2+1**, adaptado a la nueva estructura de 48 selecciones y 104 partidos.

### 3.3 Justificación de la recomendación

La razón principal para elegir Survivor 2+1 es que ofrece el mejor equilibrio entre:

- simplicidad de onboarding;
- tensión competitiva;
- claridad narrativa;
- facilidad de operación del producto;
- escalabilidad futura.

En el Mundial 2026 el torneo es más largo y el campeón puede jugar hasta 8 partidos. Eso crea una profundidad estratégica natural incluso con una mecánica sencilla. Al existir 12 grupos de 4 y luego un cuadro de 32 equipos, el usuario tiene suficientes opciones para gestionar picks sin que el juego se vuelva abrumador.

Este modelo también alinea mejor con la identidad declarada del producto:

- es simple;
- es estratégico;
- es emocional;
- es fácil de compartir;
- no depende de una lógica de apuesta;
- se diferencia claramente de una quiniela masiva.

### 3.4 Recomendación secundaria para debate

Como modelo secundario o futura variante, la mejor opción es **Pick'em + Knockout**.

No se recomienda como experiencia principal del MVP, pero sí como posible:

- modo alternativo premium;
- modalidad para comunidades grandes;
- evolución para próximas competiciones si la base de usuarios demanda más volumen de interacción.

---

## 4. Reglas oficiales base del producto

> **Nota de gobernanza del documento:** esta sección se redacta con tono formal y operativo como base normativa del producto. Es una propuesta avanzada para discusión interna y podrá ser ajustada antes del lanzamiento oficial.

# Reglamento Oficial Propuesto

## 4.1 Objeto

Oraculo Survivor es una competencia de supervivencia basada en los partidos oficiales de la Copa Mundial de la FIFA 2026. El objetivo del usuario es permanecer activo hasta el final del torneo mediante la selección oportuna de equipos nacionales en cada ventana habilitada de juego, conforme a estas reglas.

## 4.2 Estructura del torneo de referencia

Para efectos del producto, la Copa Mundial de la FIFA 2026 se entiende con la siguiente estructura validada:

- **48 selecciones participantes**
- **12 grupos de 4 selecciones**
- **32 selecciones avanzan a la ronda de eliminación directa**
- **104 partidos totales**
- **Máximo de 8 partidos para la selección campeona**
- **Países sede:** Estados Unidos, México y Canadá

### 4.2.1 Fases deportivas del torneo

1. **Fase de grupos**  
   12 grupos de 4 selecciones. Cada selección disputa 3 partidos.

2. **Round of 32 / Dieciseisavos de final**  
   Clasifican 32 selecciones.

3. **Round of 16 / Octavos de final**

4. **Cuartos de final**

5. **Semifinales**

6. **Partido por el tercer lugar**  
   Esta instancia no integra la ruta de campeón, pero puede ser incorporada por el producto como ventana jugable según el modo oficial definido.

7. **Final**

## 4.3 Modalidad oficial recomendada

La modalidad oficial propuesta para la primera versión de Oraculo Survivor será:

- **1 pick por ventana habilitada**
- **2 vidas base por usuario**
- **1 vida bonus opcional o condicionada**
- **prohibición de repetir selecciones**

## 4.4 Definiciones

Para efectos de interpretación:

- **Pick:** selección registrada por un usuario para una ventana específica de juego.
- **Ventana de juego:** período definido por el producto en el que se permite registrar un pick.
- **Vida:** margen de error que permite al usuario continuar activo pese a un pick fallido.
- **Pick ganador:** pick cuyo equipo seleccionado obtiene victoria en tiempo reglamentario o, cuando corresponda, conforme a las reglas especiales de eliminación directa establecidas en este reglamento.
- **Usuario activo:** participante que conserva al menos una vida y cumple las reglas del juego.
- **Usuario eliminado:** participante que ha agotado todas sus vidas o incurrió en una causal de anulación definitiva.

## 4.5 Mecánica general de picks

### 4.5.1 Principio general

En cada ventana habilitada, el usuario deberá elegir **una (1) selección nacional** participante de un partido oficial del Mundial 2026.

### 4.5.2 Resultado del pick

- Si la selección elegida **gana**, el usuario sobrevive y conserva sus vidas restantes.
- Si la selección elegida **empata o pierde**, el usuario pierde una vida.

### 4.5.3 Regla de no repetición

Una misma selección nacional **no podrá ser utilizada más de una vez por el mismo usuario durante toda la competencia**, salvo que el producto lance en el futuro una modalidad separada con reglas distintas.

Esta restricción aplica desde el primer pick registrado hasta la finalización total de la competencia.

### 4.5.4 Carácter individual del pick

Cada usuario es exclusivamente responsable de registrar su pick dentro del plazo correspondiente. El sistema no garantiza recordatorios suficientes para eximir el incumplimiento del usuario.

## 4.6 Diseño recomendado de ventanas de juego

Para el Mundial 2026, se recomienda operar con el siguiente esquema:

### Opción recomendada de producto: ventanas por jornada/ronda agrupada

#### Fase de grupos

Se recomienda dividir la fase de grupos en **tres jornadas de producto**, una por cada ronda oficial de partidos de grupo:

- **Jornada 1 de grupos**
- **Jornada 2 de grupos**
- **Jornada 3 de grupos**

En cada una, el usuario realiza **un (1) pick**.

#### Eliminatorias

Se recomienda una ventana por cada ronda:

- Round of 32
- Round of 16
- Cuartos de final
- Semifinales
- Final

#### Tercer lugar

**Decisión de producto (confirmada por el founder):** El partido por el tercer lugar queda **fuera del modo principal**. Puede usarse después como bonus o minijuego.

### Resultado práctico del diseño recomendado

El modo principal tendría **8 ventanas máximas de picks**:

1. Jornada 1 de grupos
2. Jornada 2 de grupos
3. Jornada 3 de grupos
4. Round of 32
5. Round of 16
6. Cuartos de final
7. Semifinales
8. Final

Esto alinea perfectamente con el dato validado de que una selección campeona puede disputar hasta 8 partidos.

## 4.7 Deadlines y cierre de picks

### 4.7.1 Regla general de cierre

**Decisión de producto (confirmada por el founder):** Ventanas por jornada completa. El pick cierra antes del primer partido de la jornada.

### 4.7.2 Regla recomendada de operación

Para máxima claridad operacional, se recomienda que el sistema utilice esta regla base:

> El pick debe quedar confirmado antes del inicio del primer partido de la ventana correspondiente.

Esto evita arbitraje de información parcial dentro de una misma jornada.

### 4.7.3 Consecuencia de no registrar pick

Si un usuario no registra pick válido antes del cierre de la ventana:

- se considerará **pick no presentado**;
- el sistema aplicará la pérdida de **una (1) vida**;
- si el usuario no dispone de vidas restantes, quedará eliminado.

## 4.8 Sistema de vidas

### 4.8.1 Vidas iniciales

La configuración oficial recomendada para el MVP es:

- **2 vidas base** para todos los usuarios registrados y validados.

### 4.8.2 Vida bonus

**Decisión de producto (confirmada por el founder):** Vida bonus universal al lanzamiento. Todos los usuarios empiezan con **3 vidas**, comunicado como "2+1 bonus". No hay condición de desbloqueo.

### 4.8.4 Causales de pérdida de vida

Un usuario perderá una vida cuando ocurra cualquiera de los siguientes supuestos:

- su selección empate;
- su selección pierda;
- no registre pick dentro del plazo;
- registre un pick inválido no corregido antes del cierre;
- su pick resulte anulado por violar la regla de no repetición y no sea reemplazado a tiempo.

## 4.9 Eliminación

### 4.9.1 Regla de eliminación

El usuario quedará eliminado cuando su contador de vidas llegue a cero.

### 4.9.2 Efectos de la eliminación

Una vez eliminado:

- no podrá registrar nuevos picks en el modo principal;
- conservará acceso a historial, ranking y visualización de competencia;
- podrá seguir interactuando con contenido, notificaciones o minijuegos si el producto los habilita.

### 4.9.3 Política de reingreso

En el modo principal recomendado, **no habrá reingreso automático** una vez consumidas todas las vidas.  
La plataforma podrá lanzar modos alternativos o promociones de reactivación, pero ello deberá considerarse una modalidad distinta y no una alteración retroactiva del reglamento principal.

## 4.10 Reglas por fase del torneo

### 4.10.1 Fase de grupos

- Un pick por jornada de grupos.
- El usuario puede elegir cualquier selección que dispute partido oficial dentro de la jornada correspondiente.
- Si la selección gana, el pick es exitoso.
- Si empata o pierde, el pick es fallido y consume una vida.

### 4.10.2 Eliminatorias

- Un pick por ronda eliminatoria.
- El usuario puede elegir cualquier selección habilitada para la ronda.
- Sigue vigente la prohibición de repetir selección ya usada en ventanas anteriores.

## 4.11 Tratamiento de empates, alargue y penales

### 4.11.1 Fase de grupos

En fase de grupos, el pick solo se considera ganador si la selección elegida **gana el partido en tiempo reglamentario oficial**.  
Si el partido termina empatado, el pick se considera fallido.

### 4.11.2 Fase de eliminación directa

Dado que las rondas eliminatorias concluyen necesariamente con un clasificado, se recomienda la siguiente norma oficial:

> En rondas de eliminación directa, el pick se considerará ganador si la selección elegida **avanza de ronda**, ya sea en tiempo reglamentario, tiempo extra o tanda de penales.

Esta definición es la más consistente con la narrativa de supervivencia del producto, porque evita penalizar al usuario cuando su selección logra el objetivo competitivo de avanzar.

### 4.11.3 Fundamento de esta regla

La lógica de “avanza de ronda” en eliminatorias:

- simplifica la comunicación;
- alinea el juego con la estructura del torneo;
- evita confusión entre empate reglamentario y clasificación efectiva;
- reduce fricción en momentos de máxima tensión.

## 4.12 Picks inválidos

Se considerará pick inválido cualquiera de los siguientes:

- selección inexistente o mal registrada;
- selección repetida ya usada por el mismo usuario;
- pick enviado fuera del plazo;
- pick asociado a una ventana distinta de la vigente;
- cualquier error técnico que no deje constancia de confirmación en el sistema.

Cuando el sistema detecte un pick inválido antes del cierre, podrá permitir corrección. Si al cierre no existe un pick válido confirmado, aplicará la regla de pick no presentado.

## 4.13 Desempates y ranking

El modo principal está orientado a supervivencia. No obstante, para ranking general, premios simbólicos, ligas privadas o leaderboard, se recomienda el siguiente orden de desempate:

1. **Mayor cantidad de vidas restantes**
2. **Mayor número de picks ganadores acumulados**
3. **Mayor dificultad acumulada de picks acertados**, medida por probabilidad implícita o rating ORÁCULO previo al partido *(solo backend en MVP, invisible al usuario)*
4. **Menor promedio de favoritismo en picks acertados**, premiando decisiones más arriesgadas y eficientes *(solo backend en MVP)*
5. **Timestamp de confirmación del último pick válido**
6. **Sorteo o criterio administrativo predefinido**, si todos los anteriores persisten empatados

### 4.13.1 Recomendación operativa

Para MVP, el ranking visible al usuario debería mostrar de forma simple:

- estado: activo o eliminado;
- vidas restantes;
- picks acertados;
- porcentaje de supervivencia;
- posición en leaderboard.

La capa avanzada de desempate puede operar por debajo sin sobrecargar la interfaz.

## 4.14 Casos especiales y edge cases

### 4.14.1 Partido suspendido antes de iniciarse

Si un partido de una selección elegida es suspendido antes de comenzar y no se disputa dentro de la misma ventana operativa definida por el producto:

- el pick quedará en estado pendiente;
- la plataforma podrá permitir reemplazo hasta un nuevo deadline si existe tiempo material;
- si no hay reemplazo habilitado, el pick podrá declararse nulo sin penalización.

### 4.14.2 Partido interrumpido y reanudado

Si un partido se interrumpe y se reanuda oficialmente dentro de un marco razonable y reconocido por la competencia, el pick permanecerá vinculado al resultado oficial final reconocido por FIFA.

### 4.14.3 Partido reprogramado fuera de ventana

Si un partido es reprogramado fuera de la ventana oficial del producto y ello impide su evaluación homogénea con el resto de la jornada o ronda, la plataforma podrá:

- declarar nulo el pick afectado; o
- habilitar reemplazo excepcional.

La decisión deberá aplicarse de forma uniforme a todos los usuarios afectados.

### 4.14.4 Walkover, retirada o descalificación

Si una selección obtiene oficialmente la victoria o el avance por walkover, retirada, descalificación o decisión oficial equivalente reconocida por la organización del torneo:

- el pick se resolverá conforme al **resultado oficial reconocido por FIFA**.

### 4.14.5 Penales

En rondas eliminatorias, una selección que clasifica por penales será considerada **pick ganador**.

### 4.14.6 Autogestión y errores del usuario

Errores derivados de selección manual incorrecta, omisión de confirmación o falta de revisión del pick serán responsabilidad del usuario, salvo falla técnica verificable de la plataforma.

### 4.14.7 Fallas técnicas de plataforma

Si existiera una falla técnica generalizada atribuible a la plataforma y verificable por logs operativos, el operador podrá:

- extender el deadline;
- anular la ventana;
- restaurar picks afectados;
- aplicar una solución uniforme de contingencia.

Toda medida de excepción deberá priorizar integridad competitiva y trato equitativo entre usuarios.

## 4.15 Calendario tentativo del producto sobre Mundial 2026

Con base en el calendario validado del torneo:

- **Partido inaugural:** 11 de junio de 2026
- **Fase de grupos:** 11 de junio al 27 de junio de 2026
- **Round of 32:** 28 de junio al 3 de julio de 2026
- **Round of 16:** 4 al 7 de julio de 2026
- **Cuartos de final:** 10 al 11 de julio de 2026
- **Semifinales:** 14 al 15 de julio de 2026
- **Tercer lugar:** 18 de julio de 2026
- **Final:** 19 de julio de 2026

### 4.15.1 Calendario tentativo de ventanas Oraculo Survivor

#### Fase de grupos

- **Ventana 1 · Jornada 1 de grupos:** 11 al 17 de junio de 2026
- **Ventana 2 · Jornada 2 de grupos:** 18 al 22 de junio de 2026
- **Ventana 3 · Jornada 3 de grupos:** 23 al 27 de junio de 2026

#### Eliminatorias

- **Ventana 4 · Round of 32:** 28 de junio al 3 de julio de 2026
- **Ventana 5 · Round of 16:** 4 al 7 de julio de 2026
- **Ventana 6 · Cuartos de final:** 10 al 11 de julio de 2026
- **Ventana 7 · Semifinales:** 14 al 15 de julio de 2026
- **Ventana 8 · Final:** 19 de julio de 2026

### 4.15.2 Observación de producto

Las fechas exactas de cierre por ventana deberán definirse por ATLAS con base en el fixture oficial final, zonas horarias y política de bloqueo operativo. Este documento fija una base conceptual y normativa, no la configuración definitiva minuto a minuto.

## 4.16 Conducta competitiva y facultades de administración

La plataforma podrá revisar y sancionar conductas que comprometan la integridad del juego, incluyendo:

- abuso técnico;
- automatización no autorizada;
- explotación de errores;
- duplicación fraudulenta de cuentas;
- manipulación de ligas privadas;
- cualquier conducta contraria al fair play digital.

La administración conservará facultad razonable para interpretar y aplicar estas reglas en escenarios no previstos expresamente, siempre bajo principios de consistencia, trazabilidad y equidad competitiva.

---

## 5. Análisis del modelo recomendado

### 5.1 Por qué Survivor 2+1 y no los otros

La recomendación a favor de Survivor 2+1 responde a una lectura de producto, no solo de reglas.

### A favor de Survivor 2+1

- Tiene la mejor curva de onboarding.
- Mantiene una identidad clara y defendible.
- Exige poco esfuerzo por usuario y mucho pensamiento por pick.
- Es ideal para Telegram, comunidades, referral loops y narrativa social.
- Es el formato más fácil de explicar en una landing, en un video corto o en una activación con creadores.
- Escala bien a públicos masivos sin multiplicar complejidad operativa.

### Por qué no Pick'em + Knockout como principal

- Aumenta demasiado la complejidad para un MVP.
- Introduce una fase inicial sin tensión de eliminación, lo cual debilita la identidad Survivor.
- Requiere más UI, más reglas, más scoring y más soporte al usuario.
- Puede ser excelente como segunda modalidad, pero no como puerta de entrada.

### Por qué no Reset Survivor como principal

- El reset fragmenta la narrativa de supervivencia continua.
- Parte del valor del juego está en administrar escasez desde el primer pick.
- Puede sentirse como “dos productos unidos” en lugar de una sola experiencia coherente.

### Por qué no Underdog Survivor como principal

- Es más original, pero menos intuitivo.
- Tiene mayor fricción cognitiva.
- Es mejor como modo experimental, contenido viral o temporada especial, no como estándar inaugural del producto.

### 5.2 Riesgos del modelo recomendado

#### Riesgo 1: eliminación temprana y abandono

**Problema:** usuarios que pierden vidas pronto pueden desconectarse emocionalmente del producto.

**Mitigaciones:**

- activar la vida bonus en cohortes iniciales;
- mantener leaderboard y narrativa aun después de eliminación;
- permitir ligas privadas o minijuegos paralelos;
- usar IRIS para reenganche con storytelling, alertas y seguimiento de comunidad.

#### Riesgo 2: exceso de conservadurismo en picks

**Problema:** los usuarios podrían elegir siempre grandes favoritos, reduciendo variedad.

**Mitigaciones:**

- desempates que premien dificultad acumulada;
- insights de ORÁCULO que muestren valor relativo, no solo favoritismo bruto;
- ligas o premios secundarios para picks de mayor inteligencia estratégica.

#### Riesgo 3: confusión en eliminatorias por penales

**Problema:** usuarios podrían no entender si cuenta el empate reglamentario o el avance.

**Mitigaciones:**

- regla única y visible: *en eliminatorias, si tu selección avanza, tu pick gana*;
- UI explícita por ronda;
- FAQs y recordatorios contextuales de IRIS.

#### Riesgo 4: saturación informativa en un torneo de 104 partidos

**Problema:** demasiados partidos pueden generar ruido y fatiga.

**Mitigaciones:**

- una ventana única por jornada o ronda;
- selección editorial curada por ORÁCULO;
- dashboard de ATLAS simplificado alrededor del pick central.

### 5.3 Escalabilidad post-Mundial

El valor más importante del modelo Survivor 2+1 es que no depende exclusivamente del Mundial 2026. El formato es altamente portable.

#### Competiciones donde escala bien

- UEFA Champions League
- Eurocopa
- Copa América
- Mundial de Clubes
- Eliminatorias continentales
- Torneos domésticos en formato especial o por jornadas clave

#### Qué se conserva al escalar

- lógica de pick único;
- tensión de vidas;
- no repetición;
- narrativa de supervivencia;
- capa de inteligencia probabilística.

#### Qué puede adaptarse por competencia

- número de vidas;
- frecuencia de ventanas;
- uso o no de bonus;
- criterio de desempate;
- definición de ronda o jornada según formato.

### 5.4 Recomendación de hoja de ruta

#### Fase 1 · MVP Mundial 2026

- Modo principal Survivor 2+1
- 8 ventanas máximas
- ranking simple
- ORÁCULO como capa de análisis y apoyo a decisión

#### Fase 2 · Variantes controladas

- Pick'em + Knockout como modo alternativo
- ligas privadas ampliadas
- configuraciones de bonus por comunidad

#### Fase 3 · Expansión multi-torneo

- reutilización del motor ATLAS
- biblioteca de reglas por competición
- narrativa modular en IRIS
- documentación normativa versionada por HERMES

---

## 6. Recomendaciones finales para debate interno

Antes de congelar la versión final del producto, conviene discutir internamente estos puntos:

1. **Si la vida bonus será universal o condicional.** → **Decidido: Universal. 3 vidas para todos.**
2. **Si el tercer lugar quedará fuera del modo principal o se usará como bonus.** → **Decidido: Fuera. Posible bonus/minijuego futuro.**
3. **Si el desempate avanzado con dificultad ORÁCULO estará activo desde el MVP o solo en backend.** → **Decidido: Solo backend, invisible al usuario.**
4. **Si la fase de grupos se bloqueará por jornada completa o por bloque parcial de partidos.** → **Decidido: Jornada completa.**
5. **Si habrá ligas privadas desde lanzamiento o solo leaderboard global.** → **Decidido: Sí, ligas privadas básicas (código, ranking, invite link).**

La recomendación general es no sobrecargar el MVP. El producto ya tiene suficiente profundidad estratégica por el simple hecho de combinar:

- ocho ventanas potenciales;
- no repetición de selección;
- vidas limitadas;
- apoyo probabilístico.

---

## 7. Conclusión

**Oraculo Survivor** tiene potencial para convertirse en una experiencia distintiva dentro del ecosistema de **Oraculo Society** porque transforma el Mundial en una narrativa de supervivencia, decisión y tensión acumulada. Para el formato 2026 de 48 selecciones, el modelo que mejor balancea simplicidad, engagement y escalabilidad es **Survivor 2+1**.

La recomendación de esta fase es clara: lanzar una experiencia base simple, altamente entendible, emocionalmente potente y respaldada por inteligencia probabilística. Al mismo tiempo, el documento deja abiertos los puntos correctos de debate para que el founder pueda ajustar bonus, desempates, ventanas y variantes futuras sin romper la identidad central del producto.