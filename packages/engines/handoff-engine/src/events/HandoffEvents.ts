import { createDomainEvent } from '@curdeeclau/shared';
import type {
  DomainEvent,
  HandoffEventType,
  ConversationOwner,
  SuppressionMode,
  HandoffState,
  HandoffTrigger,
} from '../types';

export function handoffRequested(
  conversationId: string,
  trigger: HandoffTrigger,
  matchedRuleId: string,
  reason: string,
  targetId: string,
): DomainEvent {
  return createDomainEvent('HandoffRequested', {
    conversationId,
    payload: { trigger, matchedRuleId, reason, targetId },
  });
}

export function handoffAccepted(
  conversationId: string,
  previousOwner: ConversationOwner,
  newOwner: ConversationOwner,
): DomainEvent {
  return createDomainEvent('HandoffAccepted', {
    conversationId,
    payload: { previousOwner, newOwner },
  });
}

export function handoffRejected(
  conversationId: string,
  reason: string,
): DomainEvent {
  return createDomainEvent('HandoffRejected', {
    conversationId,
    payload: { reason },
  });
}

export function ownershipChanged(
  conversationId: string,
  previousOwner: ConversationOwner,
  newOwner: ConversationOwner,
): DomainEvent {
  return createDomainEvent('OwnershipChanged', {
    conversationId,
    payload: { previousOwner, newOwner },
  });
}

export function suppressionActivated(
  conversationId: string,
  mode: SuppressionMode,
  previousMode: SuppressionMode,
): DomainEvent {
  return createDomainEvent('SuppressionActivated', {
    conversationId,
    payload: { suppressionMode: mode, previousSuppressionMode: previousMode },
  });
}

export function aiRecoveryStarted(
  conversationId: string,
  previousOwner: ConversationOwner,
): DomainEvent {
  return createDomainEvent('AIRecoveryStarted', {
    conversationId,
    payload: { previousOwner },
  });
}

export function aiRecovered(
  conversationId: string,
  previousOwner: ConversationOwner,
): DomainEvent {
  return createDomainEvent('AIRecovered', {
    conversationId,
    payload: {
      previousOwner,
      newOwner: 'AI' as ConversationOwner,
      suppressionMode: 'NONE' as SuppressionMode,
      handoffState: 'AI_RESTORED' as HandoffState,
    },
  });
}

export function handoffClosed(
  conversationId: string,
  finalState: HandoffState,
): DomainEvent {
  return createDomainEvent('HandoffClosed', {
    conversationId,
    payload: { handoffState: finalState },
  });
}
