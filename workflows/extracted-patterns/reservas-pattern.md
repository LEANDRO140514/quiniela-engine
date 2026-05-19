# Reservas Pattern

> Basado en: `reservas/agente-cabanas-v1.json` y sub-workflows de cabañas

## Problema
Las reservas de alojamiento (cabañas, habitaciones) tienen mayor complejidad que las citas: requieren verificar disponibilidad por rango de fechas (no solo un slot), manejar modificaciones que afectan precios, y coordinar confirmaciones con el propietario además del huésped.

## Adapters

| Rol | Adapter actual | Futuros |
|-----|----------------|---------|
| Canal de mensajería / inbox | Chatwoot | GHL Conversations, WhatsApp Business API, Telegram |

## Solución
Agente conversacional conectado al adapter de mensajería que gestiona el ciclo completo de reservas: consulta de disponibilidad, creación, modificación y cancelación. Cada operación es un sub-workflow separado invocado desde el agente principal.

## Estados

### Flujo principal
| Estado | Descripción |
|--------|-------------|
| `receiving` | Webhook del adapter de mensajería *(actual: Chatwoot)* |
| `routing` | Agente detecta intención (reservar / modificar / cancelar / consultar) |
| `dispatching` | Invoca sub-workflow correspondiente |
| `responding` | Envía respuesta al usuario por adapter de mensajería |

### Sub-workflow: Reservar
| Estado | Descripción |
|--------|-------------|
| `collecting` | Recopilando fechas de entrada/salida y número de personas |
| `checking` | `ComprobarFecha` — verifica disponibilidad en el rango |
| `confirming` | Esperando confirmación del usuario |
| `booked` | Reserva creada, notificaciones enviadas |

### Sub-workflow: Modificar
| Estado | Descripción |
|--------|-------------|
| `identifying` | Localizando la reserva por ID o datos del huésped |
| `collecting_new` | Nuevas fechas o datos a cambiar |
| `checking` | Verificando disponibilidad para las nuevas fechas |
| `updated` | Reserva modificada, huésped notificado |

### Sub-workflow: Cancelar
| Estado | Descripción |
|--------|-------------|
| `identifying` | Localizando la reserva |
| `confirming` | Confirmación explícita del usuario |
| `cancelled` | Reserva cancelada, disponibilidad liberada |

## Inputs
- `message.content` — mensaje del usuario *(actual: `body.conversation.messages[0].content` en Chatwoot)*
- `account_id` — cuenta del adapter de mensajería
- `conversation_id` — conversación activa
- `sender.phone_number` — teléfono del huésped
- `fecha_entrada`, `fecha_salida` — rango de la reserva
- `num_personas` — número de huéspedes
- `reserva_id` — (modificar/cancelar) ID de reserva existente

## Outputs
- `reserva_id` — ID de la reserva creada o modificada
- `confirmation_message` — mensaje de confirmación al usuario vía adapter de mensajería
- `fotos_cabana[]` — imágenes de la cabaña enviadas como media (sub-workflow `enviar-fotos`)
- `horarios_disponibles[]` — slots disponibles si la fecha pedida no está libre

## Diferencias vs Calendar Pattern
| Aspecto | Calendar (Citas) | Reservas (Cabañas) |
|---------|------------------|--------------------|
| Unidad | Slot de 1 hora | Rango de días |
| Canal | WhatsApp/genérico | Chatwoot *(adapter actual)* |
| Media | No | Fotos de la cabaña |
| Precio | No aplica | Cálculo por noches |
| Destinatario notif. | Solo usuario | Usuario + propietario |

## Edge Cases
- **Fechas solapadas con otra reserva**: mostrar próximas fechas disponibles
- **Mensaje llega sin conversación activa**: crear conversación nueva en el adapter de mensajería
- **Modificación cambia precio**: informar diferencia antes de confirmar
- **Cancelación en período no reembolsable**: advertir política antes de confirmar
- **Usuario pide fotos antes de reservar**: ejecutar `enviar-fotos` como paso previo

## Engines Futuros
- `airbnb-sync` — sincronización de disponibilidad con Airbnb iCal
- `booking-sync` — integración con Booking.com
- `stripe-deposit` — cobro automático de seña al confirmar reserva
- `whatsapp-reservas` — mismo flujo sobre WhatsApp Business API
