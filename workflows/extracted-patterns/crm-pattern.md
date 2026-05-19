# CRM Pattern

## Problema
No todos los leads tienen el mismo valor ni la misma urgencia. Sin clasificación automática, los asesores pierden tiempo en leads fríos mientras leads calientes esperan. El agente necesita enriquecer y puntuar cada contacto en tiempo real.

## Solución
El agente extrae señales de la conversación (intención, urgencia, presupuesto, comportamiento), las combina con datos del CRM existente y asigna una categoría de lead con score. El resultado alimenta la cola de trabajo del equipo de ventas.

## Estados
| Estado | Descripción |
|--------|-------------|
| `extracting` | Extrayendo señales de la conversación |
| `enriching` | Consultando CRM por historial previo |
| `scoring` | Calculando score con modelo o reglas |
| `classifying` | Asignando categoría final |
| `syncing` | Actualizando registro en CRM |
| `routing` | Dirigiendo a la cola o asesor correcto |

## Inputs
- `conversation_history[]` — historial del turno actual
- `user_id` — identificador del usuario
- `channel` — canal de origen
- `existing_crm_record` — datos previos si existen

## Outputs
- `lead_category` — `hot` | `warm` | `cold`
- `lead_score` — número 0–100
- `classification_reasons[]` — factores que determinaron la categoría
- `crm_record_id` — ID del registro actualizado
- `suggested_action` — próximo paso recomendado para el asesor

## Edge Cases
- **Lead sin historial**: clasificar solo con señales conversacionales
- **Señales contradictorias** (urgente pero presupuesto bajo): resolver con peso por factor
- **CRM no disponible**: clasificar localmente y sincronizar cuando vuelva
- **Usuario ya es cliente**: reclasificar como `upsell` en vez de lead nuevo
- **Score en zona gris** (40–60): asignar a revisión manual en vez de clasificar automáticamente

## Engines Futuros
- `hubspot-crm` — sincronización bidireccional con HubSpot
- `salesforce-crm` — integración con Salesforce CRM
- `notion-crm` — CRM ligero en Notion para equipos pequeños
- `ml-scorer` — modelo ML entrenado con datos históricos de conversión
