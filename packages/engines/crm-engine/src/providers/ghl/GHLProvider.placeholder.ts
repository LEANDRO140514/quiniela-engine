// ── GHL Provider Placeholder ──────────────────────────────
//
// Phase 2 placeholder. Throws on all operations.
// Real implementation will use GHL OAuth + REST API.
// This exists to validate the CRMProvider interface contract
// and test provider injection.

import type { CRMProvider, CreateContactInput, CreateOpportunityInput, CreatePipelineInput, CreateCampaignInput } from '../../types';
import type { CRMContact, CRMOpportunity, CRMPipeline, CRMCampaign } from '@curdeeclau/shared';

export class GHLProviderPlaceholder implements CRMProvider {
  readonly providerName = 'ghl';

  private readonly reason = 'GHL adapter not yet implemented (Phase 2)';

  async createContact(_data: CreateContactInput): Promise<CRMContact> {
    throw new Error(this.reason);
  }

  async updateContact(_id: string, _changes: Partial<CRMContact>): Promise<CRMContact> {
    throw new Error(this.reason);
  }

  async getContact(_id: string): Promise<CRMContact | undefined> {
    throw new Error(this.reason);
  }

  async findContactByProviderId(_provider: string, _providerId: string): Promise<CRMContact | undefined> {
    throw new Error(this.reason);
  }

  async createOpportunity(_data: CreateOpportunityInput): Promise<CRMOpportunity> {
    throw new Error(this.reason);
  }

  async moveOpportunity(_id: string, _stageId: string): Promise<CRMOpportunity> {
    throw new Error(this.reason);
  }

  async getOpportunity(_id: string): Promise<CRMOpportunity | undefined> {
    throw new Error(this.reason);
  }

  async createPipeline(_data: CreatePipelineInput): Promise<CRMPipeline> {
    throw new Error(this.reason);
  }

  async getPipeline(_id: string): Promise<CRMPipeline | undefined> {
    throw new Error(this.reason);
  }

  async createCampaign(_data: CreateCampaignInput): Promise<CRMCampaign> {
    throw new Error(this.reason);
  }

  async pauseCampaign(_id: string): Promise<CRMCampaign> {
    throw new Error(this.reason);
  }

  async resumeCampaign(_id: string): Promise<CRMCampaign> {
    throw new Error(this.reason);
  }

  async getCampaign(_id: string): Promise<CRMCampaign | undefined> {
    throw new Error(this.reason);
  }

  async addTag(_contactId: string, _tag: string): Promise<CRMContact> {
    throw new Error(this.reason);
  }

  async removeTag(_contactId: string, _tag: string): Promise<CRMContact> {
    throw new Error(this.reason);
  }
}
