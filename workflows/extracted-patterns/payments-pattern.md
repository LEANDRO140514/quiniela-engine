# Payments Pattern

> Basado en: `payments/mercado-pago.json`

## Problema
El flujo de pago tiene dos caminos desacoplados: (1) el agente que inicia el cobro y genera el link, y (2) el webhook de Mercado Pago que confirma cuando el usuario pagó. Sin manejar ambos, el sistema no sabe cuándo actualizar la orden.

## Solución
Dos flujos paralelos en el mismo workflow:
- **Flujo de creación**: POST a `/checkout/preferences` con los items del pedido → devuelve `init_point` (link de pago)
- **Flujo de confirmación**: Webhook `/mp-produccion-webhook` → filtra solo eventos `type: payment` → GET a `/v1/payments/{id}` para obtener el estado real del pago

## Estados
| Estado | Descripción |
|--------|-------------|
| `building_preference` | Construyendo JSON con items, payer y external_reference |
| `generating_link` | POST a Mercado Pago API → recibe `init_point` |
| `awaiting_webhook` | Esperando evento del webhook de MP |
| `filtering` | IF: solo procesa si `body.type === "payment"` |
| `verifying` | GET al payment ID para obtener status real |
| `confirmed` | Pago verificado, flujo continúa |
| `ignored` | Evento no es tipo `payment`, se descarta |

## Inputs

### Crear preferencia
```json
{
  "items": [{
    "id": "123456",
    "title": "Producto de Prueba",
    "quantity": 1,
    "currency_id": "ARS",
    "unit_price": 50000
  }],
  "payer": { "name": "...", "email": "...", "phone": {...} },
  "external_reference": "prueba_123"
}
```

### Webhook de confirmación
- `body.type` — tipo de notificación (filtrar: `"payment"`)
- `query['data.id']` — ID del pago para consultar en la API

## Outputs
- `init_point` — URL de pago para entregar al usuario (de la preferencia)
- `payment_detail` — objeto completo del pago desde `/v1/payments/{id}` (status, method, amount, etc.)

## Autenticación
- Bearer token en header `Authorization` — credencial `httpBearerAuth` (Mercado Pago Principal)
- Mismo token para crear preferencias y consultar pagos

## Edge Cases
- **Webhook con type distinto a `payment`** (ej. `merchant_order`): el IF lo descarta, no hay falsos positivos
- **`data.id` ausente en query string**: el GET falla — agregar validación antes del HTTP Request
- **Pago en estado `pending`** (ej. efectivo en Rapipago): el webhook llega antes de la acreditación — re-verificar al recibir nuevo webhook
- **Webhook duplicado de MP**: MP puede enviar el mismo evento 2 veces — idempotencia por `payment_id` necesaria
- **`external_reference`**: usar para linkear el pago con la orden interna del sistema

## Engines Futuros
- `stripe-payments` — para mercados fuera de LATAM
- `mp-subscriptions` — pagos recurrentes con Mercado Pago Subscriptions
- `mp-qr-code` — generación de QR para pago presencial
- `payment-status-poller` — polling activo para pagos en efectivo que tardan en acreditarse
