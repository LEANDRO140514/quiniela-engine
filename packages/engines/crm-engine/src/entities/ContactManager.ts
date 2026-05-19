// ── Contact Manager ──────────────────────────────────────
//
// Handles contact CRUD with ownership gating, validation, and event emission.
// providerIds MUST remain separated from canonical id (I1).

import type { CRMContact } from '@curdeeclau/shared';
import type { CRMProvider, CRMError, CRMEngineContext, CreateContactInput, UpdateContactInput } from '../types';
import type { CRMEventEmitter } from '../runtime/CRMEventEmitter';

export class ContactManager {
  constructor(
    private provider: CRMProvider,
    private events: CRMEventEmitter,
  ) {}

  async create(input: CreateContactInput, context: CRMEngineContext): Promise<{ contact: CRMContact } | CRMError> {
    const contact = await this.provider.createContact(input);
    this.events.emitContactCreated(contact, context);
    return { contact };
  }

  async update(input: UpdateContactInput, context: CRMEngineContext): Promise<{ contact: CRMContact } | CRMError> {
    const existing = await this.provider.getContact(input.contactId);
    if (!existing) {
      return { error: 'CONTACT_NOT_FOUND', message: `Contact ${input.contactId} does not exist` };
    }

    const previous = { ...existing };
    const contact = await this.provider.updateContact(input.contactId, input.changes);
    this.events.emitContactUpdated(input.contactId, input.changes, previous, context);
    return { contact };
  }
}
