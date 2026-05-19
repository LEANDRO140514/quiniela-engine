// ── Campaign Manager ─────────────────────────────────────
//
// Enforces campaign invariants:
//   I13: startAt MUST be before endAt
//   I14: archived CANNOT be resumed or paused
//   I15: completed CANNOT be paused
//   I16: draft CANNOT be paused (must activate first)

import type { CRMCampaign } from '@curdeeclau/shared';
import type { CRMProvider, CRMError, CRMEngineContext, CreateCampaignInput } from '../types';
import type { CRMEventEmitter } from '../runtime/CRMEventEmitter';

export class CampaignManager {
  constructor(
    private provider: CRMProvider,
    private events: CRMEventEmitter,
  ) {}

  async create(input: CreateCampaignInput, context: CRMEngineContext): Promise<{ campaign: CRMCampaign } | CRMError> {
    // I13: date range check
    if (input.startAt !== undefined && input.endAt !== undefined && input.startAt >= input.endAt) {
      return { error: 'INVALID_DATE_RANGE', message: 'startAt must be before endAt (I13)' };
    }

    const campaign = await this.provider.createCampaign(input);
    this.events.emitCampaignCreated(campaign, context);
    return { campaign };
  }

  async pause(campaignId: string, context: CRMEngineContext): Promise<{ campaign: CRMCampaign } | CRMError> {
    const campaign = await this.provider.getCampaign(campaignId);
    if (!campaign) {
      return { error: 'CAMPAIGN_NOT_FOUND', message: `Campaign ${campaignId} does not exist` };
    }

    // I14: archived cannot be paused
    if (campaign.status === 'archived') {
      return { error: 'CAMPAIGN_ARCHIVED', message: `Campaign ${campaignId} is archived — cannot pause (I14)` };
    }

    // I15: completed cannot be paused
    if (campaign.status === 'completed') {
      return { error: 'CAMPAIGN_COMPLETED', message: `Campaign ${campaignId} is completed — cannot pause (I15)` };
    }

    // I16: draft cannot be paused
    if (campaign.status === 'draft') {
      return { error: 'CAMPAIGN_DRAFT', message: `Campaign ${campaignId} is in draft status — must be active to pause (I16)` };
    }

    if (campaign.status === 'paused') {
      return { error: 'CAMPAIGN_ALREADY_PAUSED', message: `Campaign ${campaignId} is already paused` };
    }

    const pausedAt = Date.now();
    const updated = await this.provider.pauseCampaign(campaignId);
    this.events.emitCampaignPaused(campaignId, pausedAt, context);
    return { campaign: updated };
  }

  async resume(campaignId: string, context: CRMEngineContext): Promise<{ campaign: CRMCampaign } | CRMError> {
    const campaign = await this.provider.getCampaign(campaignId);
    if (!campaign) {
      return { error: 'CAMPAIGN_NOT_FOUND', message: `Campaign ${campaignId} does not exist` };
    }

    // I14: archived cannot be resumed
    if (campaign.status === 'archived') {
      return { error: 'CAMPAIGN_ARCHIVED', message: `Campaign ${campaignId} is archived — cannot resume (I14)` };
    }

    if (campaign.status !== 'paused') {
      return { error: 'CAMPAIGN_NOT_PAUSED', message: `Campaign ${campaignId} is not paused (current status: ${campaign.status})` };
    }

    const resumedAt = Date.now();
    const updated = await this.provider.resumeCampaign(campaignId);
    this.events.emitCampaignResumed(campaignId, resumedAt, context);
    return { campaign: updated };
  }
}
