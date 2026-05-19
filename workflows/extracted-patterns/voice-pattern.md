# Voice Pattern

> Basado en: `voice/agente-voz-mcp.json`

## Problema
Una llamada telefónica genera dos tipos de eventos: eventos en tiempo real (tool calls del agente VAPI durante la llamada) y el reporte final al colgar (`end-of-call-report`). Sin manejar ambos, se pierde información de la llamada o las acciones del agente fallan.

## Adapters

| Rol | Adapter actual | Futuros |
|-----|----------------|---------|
| Almacenamiento de leads | Google Sheets | GHL, Supabase |
| Email | Gmail (MCP) | GHL Mail, SendGrid |
| Calendario | Google Calendar (MCP) | GHL Calendar, Cal.com |

## Solución
Webhook único que bifurca según el tipo de evento VAPI:
- **End-of-call-report** → analiza la transcripción en paralelo (sentimiento + intención) y guarda en el adapter de leads
- **Tool call activo** → extrae datos del usuario y ejecuta un agente n8n con MCPs (Calendar, Email, Base de datos)

## Estados
| Estado | Descripción |
|--------|-------------|
| `receiving` | Webhook recibe evento de VAPI |
| `routing` | IF branching: `end-of-call-report` vs tool call activo |
| `analyzing` | Análisis paralelo de sentimiento e intención (Gemini) |
| `executing` | Agente ejecuta herramientas MCP en secuencia |
| `persisting` | Guardando resultados en adapter de leads |
| `responding` | Respondiendo a VAPI con resultado del tool call |

## Inputs
- `body.message.type` — tipo de evento VAPI (`end-of-call-report` | `tool-calls`)
- `body.message.artifact.transcript` — transcripción completa (solo en end-of-call)
- `body.message.toolCalls[0].function.arguments` — argumentos del tool call activo:
  - `nombre`, `apellidos`, `telefono`, `email`, `descripcion`, `fechaHora`

## Outputs

### End-of-call path
- `sentimiento` — score 1–10 basado en la transcripción (Gemini)
- `intencion` — `Compra` | `Información` | `Sin interés` (Gemini)
- Fila upsert en adapter de leads por `TELEFONO` *(actual: Google Sheets "LEADS AGENTE DE VOZ")*

### Tool call path
- Respuesta JSON para VAPI: `{ toolCallId, result }`
- Acciones ejecutadas por AGENTE: AddContactos (DB) → Agendar reunión (Calendar) → Enviar confirmación (Email)
- Respuesta final: `TRUE` si todo OK, `FALSE` si alguna herramienta falló

## Arquitectura de MCPs
```
AGENTE (Gemini/GPT-5-mini)
  ├── MCP Base de Datos → AddContactos       [adapter actual: Google Sheets → futuro: GHL]
  ├── MCP Calendario   → Disponibilidad + Crear_Evento  [adapter actual: Google Calendar → futuro: GHL]
  └── MCP Email        → Enviar_Mail         [adapter actual: Gmail → futuro: GHL Mail]
```

## Edge Cases
- **Tool call sin email**: el agente falla en MCP Calendario y Email — devuelve `FALSE`
- **Fecha/hora mal formateada**: Agente_Calendario pide aclaración antes de crear evento
- **Slot ocupado en calendario**: Agente_Calendario solicita nueva fecha en vez de sobreescribir
- **Webhook duplicado de VAPI**: idempotencia por `toolCallId`
- **Gemini no disponible**: fallback a OpenAI (modelos desactivados en el JSON, listos para activar)
- **Transcripción vacía**: sentiment/intent retornan valores neutros, no bloquean el flujo

## Engines Futuros
- `retell-voice` — integración con Retell AI como alternativa a VAPI
- `twilio-voice` — llamadas salientes con Twilio + análisis post-call
- `elevenlabs-tts` — texto a voz para respuestas dinámicas del agente
- `whisper-transcription` — transcripción propia sin depender del proveedor de voz
