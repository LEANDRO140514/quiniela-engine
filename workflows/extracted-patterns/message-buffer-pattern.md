# Message Buffer Pattern

## Problema
Los canales de mensajería (WhatsApp, Telegram, etc.) disparan múltiples eventos en milisegundos cuando el usuario escribe varias líneas o adjunta archivos. Sin buffer, el agente responde a cada fragmento por separado, generando respuestas incoherentes y costosas.

## Solución
Acumular mensajes en Redis con una ventana de tiempo (TTL). Solo cuando el flujo de mensajes se detiene (silencio > N ms) se consolida el payload y se dispara el pipeline del agente.

## Estados
| Estado | Descripción |
|--------|-------------|
| `idle` | Sin mensajes pendientes |
| `buffering` | Acumulando mensajes dentro de la ventana |
| `flushing` | Consolidando y enviando al agente |
| `error` | Fallo en Redis o timeout excedido |

## Inputs
- `channel_id` — identificador del canal (ej. número de WhatsApp)
- `user_id` — identificador del usuario
- `message` — texto, media o evento recibido
- `timestamp` — tiempo del evento

## Outputs
- `consolidated_payload` — todos los mensajes del turno agrupados
- `media_urls[]` — lista de adjuntos si los hay
- `intent_hint` — señal opcional de intención detectada antes de flush

## Edge Cases
- **Mensaje único largo**: no acumula, flush inmediato tras TTL
- **Media + texto simultáneos**: el buffer espera ambos antes de consolidar
- **Redis caído**: fallback a flush inmediato sin buffer (fail-open)
- **Usuario escribe por 10+ min sin parar**: flush forzado por tamaño máximo (`maxMessages`)
- **Mensajes fuera de orden**: ordenar por `timestamp` antes de consolidar

## Engines Futuros
- `kafka-buffer` — para volúmenes altos con persistencia garantizada
- `in-memory-buffer` — para entornos sin Redis (desarrollo local)
- `websocket-buffer` — para canales web en tiempo real
