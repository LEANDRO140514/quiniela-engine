# Handoff Pattern

## Problema
En conversaciones complejas o de alto valor, el agente llega a un límite: baja confianza en la respuesta, solicitud explícita del usuario, o detección de fricción emocional. Transferir sin contexto al asesor humano genera frustración y pérdida de información.

## Solución
El agente empaqueta el historial relevante, el perfil del usuario, el intent detectado y el motivo del handoff. Lo entrega estructurado al sistema CRM/asesor antes de notificar al usuario que será atendido por una persona.

## Estados
| Estado | Descripción |
|--------|-------------|
| `evaluating` | Detectando si el handoff es necesario |
| `packaging` | Armando el contexto para el asesor |
| `notifying` | Informando al usuario del cambio |
| `transferred` | Conversación activa con asesor |
| `returned` | El asesor devuelve el control al agente |

## Inputs
- `conversation_history[]` — historial completo del turno
- `user_profile` — datos del CRM del usuario
- `trigger_reason` — motivo del handoff (`low_confidence` | `user_request` | `escalation_rule`)
- `priority` — urgencia asignada (`low` | `medium` | `high`)

## Outputs
- `handoff_package` — JSON con contexto consolidado para el asesor
- `user_message` — mensaje al usuario confirmando el cambio
- `crm_ticket_id` — ID del ticket creado en el CRM
- `eta_minutes` — tiempo estimado de espera si está disponible

## Edge Cases
- **Sin asesores disponibles**: informar al usuario + encolar con ETA
- **Asesor rechaza**: re-encolar o escalar a supervisor
- **Usuario se va antes del handoff**: marcar ticket como abandonado
- **Handoff loop**: agente y asesor se pasan el caso — detectar y escalar
- **Datos sensibles en historial**: sanitizar antes de enviar al CRM

## Engines Futuros
- `zendesk-handoff` — integración con Zendesk Tickets
- `intercom-handoff` — transferencia nativa a Intercom
- `slack-handoff` — notificación a canal de Slack del equipo
- `round-robin-router` — distribución automática entre asesores disponibles
