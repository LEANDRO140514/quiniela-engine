# @curdeeclau/media-delivery-engine

Multi-channel rich media delivery engine.

## Scope
- Supported types: image, PDF, audio, video, document
- Channels: WhatsApp, email, web, SMS
- Presigned URL upload flow
- Abstract `MediaProvider` — plug any channel backend
- Delivery and view tracking

## Status
Phase 2B — interfaces and types only. No real provider implementations yet.

## Usage (future)
```ts
import { MediaDeliveryEngine } from '@curdeeclau/media-delivery-engine';
const engine = new MediaDeliveryEngine(config);
engine.registerProvider(new WhatsAppMediaProvider());
const receipt = await engine.send({ assetId, channel: 'whatsapp', to });
```
