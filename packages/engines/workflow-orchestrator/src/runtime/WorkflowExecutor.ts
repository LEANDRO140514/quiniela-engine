import type { DomainEvent } from '@curdeeclau/shared';
import type { StepResult } from '@curdeeclau/shared';
import type {
  WorkflowDefinition,
  WorkflowContext,
  WorkflowStep,
} from '../types';
import type { InMemoryEngineRegistry } from '../registry/EngineRegistry';
import type { StateResolver } from './StateResolver';
import { createEvent } from '../events/DomainEvent';

export class WorkflowExecutor {
  constructor(
    private engines: InMemoryEngineRegistry,
    private stateResolver: StateResolver,
    private emitEvent: (event: DomainEvent) => Promise<void>,
  ) {}

  async execute(
    definition: WorkflowDefinition,
    context: WorkflowContext,
    triggerEvent?: DomainEvent,
  ): Promise<WorkflowContext> {
    const steps = definition.steps;
    let currentContext = { ...context };

    if (triggerEvent) {
      const transition = this.stateResolver.validateTransition(
        currentContext.currentState,
        triggerEvent.type,
      );

      if (transition.valid) {
        currentContext.currentState = transition.target;
        await this.emitEvent(
          createEvent('StateTransitioned', {
            workflowId: definition.id,
            conversationId: currentContext.conversationId,
            correlationId: currentContext.correlationId,
            payload: {
              from: context.currentState,
              to: transition.target,
              event: triggerEvent.type,
            },
          }),
        );
      }
    }

    for (const step of steps) {
      const stepResult = await this.executeStep(step, currentContext);
      currentContext.steps.push(stepResult);
      currentContext.updatedAt = Date.now();

      if (stepResult.status === 'failed' && !step.onFailure?.fallbackStep) {
        await this.emitEvent(
          createEvent('WorkflowFailed', {
            workflowId: definition.id,
            conversationId: currentContext.conversationId,
            correlationId: currentContext.correlationId,
            payload: { failedStep: step.id, error: stepResult.error },
          }),
        );
        break;
      }
    }

    await this.emitEvent(
      createEvent('WorkflowCompleted', {
        workflowId: definition.id,
        conversationId: currentContext.conversationId,
        correlationId: currentContext.correlationId,
        payload: { totalSteps: steps.length, completedSteps: currentContext.steps.length },
      }),
    );

    return currentContext;
  }

  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
  ): Promise<StepResult> {
    const startedAt = Date.now();

    await this.emitEvent(
      createEvent('WorkflowStepExecuted', {
        workflowId: context.workflowId,
        conversationId: context.conversationId,
        correlationId: context.correlationId,
        payload: { stepId: step.id, stepName: step.name },
      }),
    );

    if (step.type === 'terminate') {
      return {
        stepId: step.id,
        stepName: step.name,
        status: 'completed',
        startedAt,
        completedAt: Date.now(),
        attempts: 1,
      };
    }

    if (step.type === 'decision') {
      return this.evaluateDecision(step, context, startedAt);
    }

    const engine = this.engines.get(step.engine);
    if (!engine) {
      return {
        stepId: step.id,
        stepName: step.name,
        status: 'failed',
        error: `Engine "${step.engine}" not found for step "${step.id}"`,
        startedAt,
        completedAt: Date.now(),
        attempts: 0,
      };
    }

    try {
      const output = await engine.execute(step.action, {
        ...context.input,
        ...context.state,
        stepInput: step.input ?? {},
      });

      if (step.type === 'action') {
        const nextState = this.stateResolver.resolveNextState(
          context.currentState,
          step.action,
        );
        context.currentState = nextState;
      }

      return {
        stepId: step.id,
        stepName: step.name,
        status: 'completed',
        output,
        startedAt,
        completedAt: Date.now(),
        attempts: 1,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      await this.emitEvent(
        createEvent('WorkflowStepFailed', {
          workflowId: context.workflowId,
          conversationId: context.conversationId,
          correlationId: context.correlationId,
          payload: { stepId: step.id, error: errorMsg },
        }),
      );

      return {
        stepId: step.id,
        stepName: step.name,
        status: 'failed',
        error: errorMsg,
        startedAt,
        completedAt: Date.now(),
        attempts: 1,
      };
    }
  }

  private evaluateDecision(
    step: WorkflowStep,
    context: WorkflowContext,
    startedAt: number,
  ): StepResult {
    if (!step.conditions || step.conditions.length === 0) {
      return {
        stepId: step.id,
        stepName: step.name,
        status: 'completed',
        startedAt,
        completedAt: Date.now(),
        attempts: 1,
      };
    }

    for (const condition of step.conditions) {
      const fieldValue = context.state[condition.field] ?? context.input[condition.field];
      if (this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return {
          stepId: step.id,
          stepName: step.name,
          status: 'completed',
          output: { nextStep: condition.nextStep, matchedCondition: condition },
          startedAt,
          completedAt: Date.now(),
          attempts: 1,
        };
      }
    }

    return {
      stepId: step.id,
      stepName: step.name,
      status: 'failed',
      error: 'No condition matched',
      startedAt,
      completedAt: Date.now(),
      attempts: 1,
    };
  }

  private evaluateCondition(
    fieldValue: unknown,
    operator: string,
    expectedValue: unknown,
  ): boolean {
    switch (operator) {
      case 'eq': return fieldValue === expectedValue;
      case 'neq': return fieldValue !== expectedValue;
      case 'gt': return (fieldValue as number) > (expectedValue as number);
      case 'gte': return (fieldValue as number) >= (expectedValue as number);
      case 'lt': return (fieldValue as number) < (expectedValue as number);
      case 'lte': return (fieldValue as number) <= (expectedValue as number);
      case 'in': return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case 'contains': return typeof fieldValue === 'string' && typeof expectedValue === 'string' && fieldValue.includes(expectedValue);
      case 'exists': return fieldValue !== undefined && fieldValue !== null;
      default: return false;
    }
  }
}
