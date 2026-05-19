# Media Pattern

## Problema
El envío de imágenes, documentos y archivos multimedia varía en comportamiento según el canal (WhatsApp, Telegram, web). Sin un patrón unificado, cada integración maneja media de forma distinta, duplicando lógica de validación, almacenamiento y entrega.

## Solución
Capa de abstracción que normaliza el envío de media: recibe el archivo, lo valida, lo sube a storage (S3/CDN), genera URL firmada y delega la entrega al adaptador del canal correspondiente.

## Estados
| Estado | Descripción |
|--------|-------------|
| `receiving` | Archivo recibido desde el agente o usuario |
| `validating` | Verificando tipo, tamaño y contenido |
| `uploading` | Subiendo a storage (S3, Supabase Storage, etc.) |
| `signing` | Generando URL firmada o pública |
| `delivering` | Enviando al canal de destino |
| `delivered` | Confirmación de entrega recibida |

## Inputs
- `file` — archivo binario o URL de origen
- `media_type` — `image` | `document` | `video` | `audio`
- `channel` — canal de destino (`whatsapp` | `telegram` | `web`)
- `recipient_id` — destinatario en el canal
- `caption` — texto opcional acompañante

## Outputs
- `media_id` — ID del archivo en el canal
- `storage_url` — URL permanente en storage
- `delivery_status` — `sent` | `delivered` | `failed`
- `timestamp` — tiempo de entrega confirmada

## Edge Cases
- **Formato no soportado por el canal**: convertir automáticamente o rechazar con mensaje
- **Archivo supera límite del canal**: comprimir o dividir si es posible
- **URL de origen expirada**: reintentar descarga antes de fallar
- **Canal sin soporte de media**: enviar enlace descargable como fallback
- **Contenido inapropiado**: moderation check antes de entregar

## Engines Futuros
- `cloudinary-media` — transformación y optimización con Cloudinary
- `telegram-media` — entrega nativa por Telegram Bot API
- `whatsapp-media` — integración con WhatsApp Business API
- `s3-storage` — almacenamiento en AWS S3 con CDN CloudFront
