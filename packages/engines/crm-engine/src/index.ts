// ── CRM Engine — Barrel Exports ──────────────────────────

// Engine
export { CRMEngine } from './engine/CRMEngine';

// Providers
export { InMemoryCRMProvider } from './providers/memory/InMemoryCRMProvider';
export { GHLProviderPlaceholder } from './providers/ghl/GHLProvider.placeholder';

// Entity Managers
export { ContactManager } from './entities/ContactManager';
export { OpportunityManager } from './entities/OpportunityManager';
export { PipelineManager } from './entities/PipelineManager';
export { CampaignManager } from './entities/CampaignManager';
export { TagManager } from './entities/TagManager';

// Runtime
export { CRMEventEmitter } from './runtime/CRMEventEmitter';
export type { EventHandler } from './runtime/CRMEventEmitter';
export { OwnershipGuard } from './runtime/OwnershipGuard';
export { CRMValidation } from './runtime/CRMValidation';

// Events
export {
  contactCreated,
  contactUpdated,
  opportunityCreated,
  opportunityMoved,
  tagAdded,
  tagRemoved,
  pipelineCreated,
  campaignCreated,
  campaignPaused,
  campaignResumed,
} from './events/CRMEvents';

// Types
export { isCRMError } from './types';
export type {
  CRMEventType,
  CRMErrorCode,
  CRMError,
  CRMProvider,
  CreateContactInput,
  UpdateContactInput,
  CreateOpportunityInput,
  MoveOpportunityInput,
  CreatePipelineInput,
  CreateCampaignInput,
  AddTagInput,
  RemoveTagInput,
  CRMEngineConfig,
  CRMEngineContext,
} from './types';
