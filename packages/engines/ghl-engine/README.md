# @curdeeclau/ghl-engine

GoHighLevel CRM abstraction layer.

## Scope
- Contact CRUD (find by phone/email, create, update)
- Opportunity / pipeline tracking
- Appointment sync
- Webhook parsing and signature verification
- Abstract `GHLApiClient` — swap real API, mock, or stub

## Status
Phase 2B — interfaces and types only. No real API client implementation yet.

## Usage (future)
```ts
import { GHLEngine } from '@curdeeclau/ghl-engine';
const engine = new GHLEngine();
await engine.initialize({ locationId, apiKey });
const contact = await engine.getClient()?.findContactByPhone('+52155...');
```
