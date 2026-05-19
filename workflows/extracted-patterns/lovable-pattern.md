# Lovable Pattern (CRM Conversacional)

> Basado en: `lovable/lovable.json`

## Problema
Los equipos de ventas necesitan actualizar el CRM en tiempo real desde cualquier canal, sin abrir una interfaz web. Escribir naturalmente "cambiá la etapa de Ana Díaz a Ganado" debe traducirse a una operación precisa en la base de datos sin ambigüedad.

## Adapters

| Rol | Adapter actual | Futuros |
|-----|----------------|---------|
| CRM / Almacenamiento | Google Sheets | GHL, HubSpot, Supabase |

## Solución
Agente conversacional (GPT-4.1-mini) con memoria de sesión que interpreta instrucciones en lenguaje natural y ejecuta operaciones CRUD sobre el adapter de CRM. Dos herramientas atómicas: `Crear` (append) y `Actualizar` (update by Contacto).

## Estados
| Estado | Descripción |
|--------|-------------|
| `receiving` | Webhook recibe mensaje con `body.message` y `body.user_session` |
| `reasoning` | Agente analiza instrucción y extrae variables |
| `creating` | Append de nuevo registro en adapter de CRM |
| `updating` | Update de registro existente por clave `Contacto` |
| `confirming` | Agente responde con confirmación en español |

## Schema del CRM *(adapter actual: Google Sheets "Tabla 1")*
| Campo | Tipo | Requerido | Valores posibles |
|-------|------|-----------|-----------------|
| `id` | string | — | Auto (CREADO) |
| `Empresa` | string | Crear: sí | Libre |
| `Contacto` | string | Crear: sí | Libre (clave de búsqueda) |
| `Prioridad` | string | Crear: sí | Alta, Media, Baja |
| `EtapaPipeline` | string | Crear: sí | Nuevo, Calificado, Demo agendada, Negociación, Ganado |
| `ProximoContacto` | string | No | YYYY-MM-DD |
| `ValorEstimado(USD)` | string | No | Número |
| `Canal` | string | Crear: sí | Orgánico, Outbound, Inbound, Referido |
| `Owner` | string | Crear: sí | Ignacio, Valentina, Delfina, Santiago |

## Inputs
- `body.message` — instrucción en lenguaje natural
- `body.user_session` — clave de sesión para memoria de contexto (ventana de 10 mensajes)

## Outputs
- `response` — confirmación en español al usuario (webhook response)
- Operación ejecutada en adapter de CRM (append o update)

## Herramientas del Agente
```
AI Agent (GPT-4.1-mini, temp=0.1)
  ├── Crear      → CRM adapter append   [actual: googleSheetsTool → futuro: GHL contact create]
  └── Actualizar → CRM adapter update   [actual: googleSheetsTool → futuro: GHL contact update]
```

## Edge Cases
- **Contacto no encontrado para update**: agente pide confirmación en vez de crear uno nuevo
- **Campos obligatorios faltantes para Crear**: agente solicita los datos que faltan
- **Instrucción ambigua**: agente pide aclaración antes de ejecutar
- **Valores fuera del enum** (ej. etapa "Cerrado" en vez de "Ganado"): agente corrige al valor más cercano e informa
- **Sesión expirada** (más de 10 mensajes): contexto se resetea, agente puede perder referencia a "el último lead"

## Engines Futuros
- `hubspot-crm-tool` — mismo agente contra HubSpot API
- `notion-crm-tool` — CRM en Notion Database
- `airtable-crm-tool` — CRM en Airtable
- `supabase-crm-tool` — CRM en PostgreSQL con RLS por owner
