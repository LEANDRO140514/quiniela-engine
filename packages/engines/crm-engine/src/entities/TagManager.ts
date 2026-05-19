// ── Tag Manager ──────────────────────────────────────────
//
// Handles add/remove tag operations on contacts.
// Tags are free-form, deduplicated.
// AI can tag (I19), but LOCKED blocks all.

import type { CRMContact } from '@curdeeclau/shared';
import type { CRMProvider, CRMError, CRMEngineContext } from '../types';
import type { CRMEventEmitter } from '../runtime/CRMEventEmitter';

export class TagManager {
  constructor(
    private provider: CRMProvider,
    private events: CRMEventEmitter,
  ) {}

  async add(contactId: string, tag: string, context: CRMEngineContext): Promise<{ contact: CRMContact } | CRMError> {
    const contact = await this.provider.getContact(contactId);
    if (!contact) {
      return { error: 'CONTACT_NOT_FOUND', message: `Contact ${contactId} does not exist` };
    }

    const updated = await this.provider.addTag(contactId, tag);
    this.events.emitTagAdded(contactId, tag, context);
    return { contact: updated };
  }

  async remove(contactId: string, tag: string, context: CRMEngineContext): Promise<{ contact: CRMContact } | CRMError> {
    const contact = await this.provider.getContact(contactId);
    if (!contact) {
      return { error: 'CONTACT_NOT_FOUND', message: `Contact ${contactId} does not exist` };
    }

    if (!contact.tags.includes(tag)) {
      return { error: 'TAG_NOT_FOUND', message: `Tag "${tag}" not found on contact ${contactId}` };
    }

    const updated = await this.provider.removeTag(contactId, tag);
    this.events.emitTagRemoved(contactId, tag, context);
    return { contact: updated };
  }
}
