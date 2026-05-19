# Agents Pattern (Asistente Personal Multicanal)

> Basado en: `agents/asistente-personal.json`

## Problema
Un asistente personal necesita manejar múltiples tipos de input desde el mismo canal (Telegram): texto, voz, imágenes, documentos. Cada tipo requiere procesamiento diferente antes de llegar al LLM, y el usuario espera respuestas en el mismo formato que envió.

## Solución
Agente Telegram con router de tipos de mensaje. El nodo Switch bifurca el flujo según si el mensaje es texto, audio o media. Cada rama pre-procesa el input (transcripción si es audio, OCR/descripción si es imagen) antes de pasarlo al agente LLM central con memoria persistente.

## Estados
| Estado | Descripción |
|--------|-------------|
| `listening` | Telegram Trigger esperando mensajes |
| `routing` | Switch identifica tipo: `texto` \| `audio` \| `media` \| `otro` |
| `processing_text` | Texto directo al agente |
| `processing_audio` | Descarga + transcripción antes del agente |
| `processing_media` | Descarga + descripción/OCR antes del agente |
| `reasoning` | Agente LLM procesa con memoria de contexto |
| `responding` | Respuesta enviada por Telegram |

## Inputs
- `message.text` — mensaje de texto del usuario
- `message.voice` / `message.audio` — nota de voz o archivo de audio
- `message.photo[0].file_id` — foto (la rama `imagen` del Switch)
- `message.chat.id` — identificador del chat para responder

## Outputs
- Respuesta de texto vía Telegram
- Acciones ejecutadas por herramientas del agente (calendario, notas, búsquedas, etc.)

## Arquitectura
```
Telegram Trigger
  └── Switch (por tipo de mensaje)
       ├── texto   → directo al Agente
       ├── audio   → Transcripción → Agente
       └── imagen  → Descripción   → Agente
                          ↓
                    Agente LLM (con memoria)
                          ↓
                    Telegram Send Message
```

## Edge Cases
- **Mensaje sin tipo reconocible** (sticker, contacto, ubicación): rama `otro` responde con "No puedo procesar este tipo de mensaje"
- **Audio demasiado largo**: transcripción puede exceder límites del modelo — dividir antes de procesar
- **Imagen borrosa o ilegible**: agente informa que no puede extraer información útil
- **Usuario envía múltiples mensajes rápido**: sin buffer Redis, el agente responde a cada uno por separado

## Edge Case crítico: Sin buffer
A diferencia del `message-buffer-pattern`, este agente no tiene Redis buffer. Cada mensaje genera una ejecución independiente. Para mejorar la experiencia en conversaciones fragmentadas, se recomienda combinar con el `message-buffer-pattern`.

## Engines Futuros
- `whatsapp-assistant` — mismo patrón sobre WhatsApp Business API
- `discord-assistant` — adaptado para Discord bots
- `telegram-groups` — soporte para grupos con mención @bot
- `voice-response` — responder con audio (TTS) cuando el input fue de voz
