import type { HandoffPolicySet, HandoffRule, HandoffEvalContext, HandoffCondition } from '../types';

export class HandoffPolicyEvaluator {
  private policies: HandoffPolicySet | null = null;

  loadPolicies(policies: HandoffPolicySet): void {
    this.policies = policies;
  }

  getPolicies(): HandoffPolicySet | null {
    return this.policies;
  }

  evaluate(context: HandoffEvalContext): HandoffRule[] {
    if (!this.policies) {
      return [];
    }

    const enabledRules = this.policies.rules.filter((r) => r.enabled);
    const matched = enabledRules.filter((rule) => this.ruleMatches(rule, context));

    matched.sort((a, b) => a.priority - b.priority);
    return matched;
  }

  findTarget(targetId: string) {
    if (!this.policies) return undefined;
    return this.policies.targets.find((t) => t.id === targetId);
  }

  getDefaultTimeoutMs(): number {
    return this.policies?.defaultTimeoutMs ?? 300_000;
  }

  private ruleMatches(rule: HandoffRule, context: HandoffEvalContext): boolean {
    return rule.conditions.every((c) => this.conditionMatches(c, context));
  }

  private conditionMatches(condition: HandoffCondition, context: HandoffEvalContext): boolean {
    const fieldValue = this.resolveField(condition.field, context);
    const expected = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === expected;

      case 'contains': {
        if (typeof fieldValue === 'string' && Array.isArray(expected)) {
          const lower = fieldValue.toLowerCase();
          return (expected as string[]).some((kw) => lower.includes(kw.toLowerCase()));
        }
        if (typeof fieldValue === 'string' && typeof expected === 'string') {
          return fieldValue.toLowerCase().includes(expected.toLowerCase());
        }
        return false;
      }

      case 'in': {
        if (Array.isArray(expected)) {
          return expected.includes(fieldValue as string);
        }
        return false;
      }

      case 'gte': {
        if (condition.field === 'timeOfDay') {
          return this.compareTimeOfDay(fieldValue as string, expected as string);
        }
        if (condition.field === 'conversationDuration') {
          return (fieldValue as number) >= (expected as number);
        }
        return false;
      }

      case 'lte':
        return (fieldValue as number) <= (expected as number);

      case 'regex': {
        if (typeof fieldValue === 'string' && typeof expected === 'string') {
          try {
            return new RegExp(expected, 'i').test(fieldValue);
          } catch {
            return false;
          }
        }
        return false;
      }

      default:
        return false;
    }
  }

  private resolveField(field: HandoffCondition['field'], context: HandoffEvalContext): unknown {
    switch (field) {
      case 'keyword':
        return context.keywords?.join(' ') ?? '';
      case 'escalationLevel':
        return context.escalationLevel;
      case 'intent':
        return context.intent ?? '';
      case 'sentiment':
        return context.sentiment ?? 'neutral';
      case 'timeOfDay':
        return context.timeOfDay ?? '00:00';
      case 'conversationDuration':
        return context.conversationDurationMs ?? 0;
      default:
        return '';
    }
  }

  private compareTimeOfDay(current: string, threshold: string): boolean {
    const [curH, curM] = current.split(':').map(Number);
    const [thrH, thrM] = threshold.split(':').map(Number);
    if (isNaN(curH) || isNaN(curM) || isNaN(thrH) || isNaN(thrM)) return false;
    return curH * 60 + curM >= thrH * 60 + thrM;
  }
}
