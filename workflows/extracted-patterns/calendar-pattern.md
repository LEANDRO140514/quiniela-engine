# Calendar Pattern

## Problema
Gestionar citas por conversación implica múltiples sub-intenciones (reservar, modificar, cancelar) que comparten lógica de disponibilidad pero tienen estados y validaciones distintas. Sin un patrón unificado, cada flujo duplica código y diverge en comportamiento.

## Solución
Un patrón de calendario con tres operaciones atómicas (reservar, modificar, cancelar) que comparten un núcleo de disponibilidad y notificaciones, pero tienen sus propios estados de validación y confirmación.

## Estados

### Reservar
| Estado | Descripción |
|--------|-------------|
| `collecting` | Recopilando fecha, hora y datos del usuario |
| `checking` | Verificando disponibilidad en calendario |
| `confirming` | Esperando confirmación del usuario |
| `booked` | Cita creada y notificación enviada |

### Modificar
| Estado | Descripción |
|--------|-------------|
| `identifying` | Localizando la cita a modificar |
| `collecting_new` | Recopilando nueva fecha/hora |
| `checking` | Verificando disponibilidad del nuevo slot |
| `confirming` | Esperando confirmación del usuario |
| `updated` | Cita actualizada y notificada |

### Cancelar
| Estado | Descripción |
|--------|-------------|
| `identifying` | Localizando la cita a cancelar |
| `confirming` | Esperando confirmación del usuario |
| `cancelled` | Cita cancelada, slot liberado, notificación enviada |

## Inputs
- `user_id` — identificador del usuario
- `requested_datetime` — fecha y hora solicitada
- `appointment_id` — (modificar/cancelar) ID de la cita existente
- `service_type` — tipo de servicio o reunión
- `duration_minutes` — duración esperada

## Adapters

| Rol | Adapter actual | Futuros |
|-----|----------------|---------|
| Calendario | Google Calendar | GHL Calendar, Cal.com, Calendly, Outlook |

## Outputs
- `appointment_id` — ID de la cita creada o modificada
- `confirmation_message` — mensaje de confirmación para el usuario
- `calendar_event` — objeto de evento para el adapter de calendario *(actual: Google Calendar)*
- `notification_sent` — booleano de confirmación de envío

## Edge Cases
- **Slot no disponible**: ofrecer los 3 slots más cercanos disponibles
- **Cita no encontrada** (modificar/cancelar): pedir al usuario más datos
- **Cancelación fuera de política**: informar penalización o restricción
- **Doble booking**: validar conflictos antes de confirmar
- **Zona horaria distinta**: normalizar siempre a UTC, mostrar en zona local del usuario
- **Sin confirmación del usuario**: timeout de 10 min y cancelar el intento

## Engines Futuros
- `google-calendar-engine` — integración nativa con Google Calendar API
- `calendly-engine` — sincronización con Calendly
- `cal-com-engine` — integración open-source con Cal.com
- `outlook-engine` — para entornos Microsoft 365
