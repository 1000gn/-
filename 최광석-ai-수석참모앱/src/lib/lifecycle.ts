import { setup, type AnyStateMachine } from 'xstate';
import { canAdopt, canApproveDecision, type ProjectContext } from './ability';
import {
  toCanonicalDecisionStatus,
  toCanonicalActionStatus,
  type CanonicalDecisionStatus,
  type CanonicalActionStatus,
  type DecisionStatus,
  type ActionStatus,
} from '../types';

export interface LifecycleContext {
  projectContext?: ProjectContext;
}

export interface LifecycleEvent<T extends string = string> {
  type: T;
  projectContext?: ProjectContext;
  ctx?: ProjectContext;
}

/* =========================================================================
   1. Decision Lifecycle State Machine (XState v5)
   Transitions:
   DRAFT → AI_RECOMMENDED → UNDER_REVIEW → [APPROVED | REJECTED | DEFERRED]
         → EXECUTING → COMPLETED → REVIEWED → ARCHIVED (REOPENED / CANCELLED allowed)
   Guard: canApproveDecision / canAdopt (REAL requires OWNER)
   ========================================================================= */

export const decisionSetup = setup({
  types: {
    context: {} as LifecycleContext,
    events: {} as { type: string; projectContext?: Partial<ProjectContext>; ctx?: Partial<ProjectContext> },
  },
  guards: {
    canApproveGuard: ({ event }) => {
      const rawCtx = event.projectContext || event.ctx;
      if (!rawCtx) return true; // Default structural check passes if no context is enforced
      const ctx: ProjectContext = {
        projectId: rawCtx.projectId || 'proj-gunsan-pmi',
        environment: rawCtx.environment || 'TEST',
        callerId: rawCtx.callerId || 'user',
        callerEmail: rawCtx.callerEmail || '',
        callerRole: rawCtx.callerRole || 'GUEST',
        isAuthenticated: rawCtx.isAuthenticated ?? (!!rawCtx.callerEmail || !!rawCtx.callerRole),
      };
      return canApproveDecision(ctx);
    },
    canAdoptGuard: ({ event }) => {
      const rawCtx = event.projectContext || event.ctx;
      if (!rawCtx) return true;
      const ctx: ProjectContext = {
        projectId: rawCtx.projectId || 'proj-gunsan-pmi',
        environment: rawCtx.environment || 'TEST',
        callerId: rawCtx.callerId || 'user',
        callerEmail: rawCtx.callerEmail || '',
        callerRole: rawCtx.callerRole || 'GUEST',
        isAuthenticated: rawCtx.isAuthenticated ?? (!!rawCtx.callerEmail || !!rawCtx.callerRole),
      };
      return canAdopt(ctx);
    },
  },
});

export const decisionMachine = decisionSetup.createMachine({
  id: 'decision',
  initial: 'DRAFT',
  states: {
    DRAFT: {
      on: {
        AI_RECOMMENDED: 'AI_RECOMMENDED',
        UNDER_REVIEW: 'UNDER_REVIEW',
        CANCELLED: 'CANCELLED',
      },
    },
    AI_RECOMMENDED: {
      on: {
        UNDER_REVIEW: 'UNDER_REVIEW',
        APPROVED: {
          target: 'APPROVED',
          guard: 'canApproveGuard',
        },
        REJECTED: 'REJECTED',
        DEFERRED: 'DEFERRED',
        CANCELLED: 'CANCELLED',
      },
    },
    UNDER_REVIEW: {
      on: {
        APPROVED: {
          target: 'APPROVED',
          guard: 'canApproveGuard',
        },
        REJECTED: 'REJECTED',
        DEFERRED: 'DEFERRED',
        CANCELLED: 'CANCELLED',
      },
    },
    APPROVED: {
      on: {
        EXECUTING: 'EXECUTING',
        DEFERRED: 'DEFERRED',
        CANCELLED: 'CANCELLED',
      },
    },
    REJECTED: {
      on: {
        UNDER_REVIEW: 'UNDER_REVIEW',
        REOPENED: 'REOPENED',
        ARCHIVED: 'ARCHIVED',
        CANCELLED: 'CANCELLED',
      },
    },
    DEFERRED: {
      on: {
        UNDER_REVIEW: 'UNDER_REVIEW',
        APPROVED: {
          target: 'APPROVED',
          guard: 'canApproveGuard',
        },
        CANCELLED: 'CANCELLED',
        ARCHIVED: 'ARCHIVED',
      },
    },
    EXECUTING: {
      on: {
        COMPLETED: 'COMPLETED',
        DEFERRED: 'DEFERRED',
        CANCELLED: 'CANCELLED',
      },
    },
    COMPLETED: {
      on: {
        REVIEWED: 'REVIEWED',
        REOPENED: 'REOPENED',
        ARCHIVED: 'ARCHIVED',
      },
    },
    REVIEWED: {
      on: {
        ARCHIVED: 'ARCHIVED',
        REOPENED: 'REOPENED',
      },
    },
    ARCHIVED: {
      on: {
        REOPENED: 'REOPENED',
      },
    },
    REOPENED: {
      on: {
        UNDER_REVIEW: 'UNDER_REVIEW',
        EXECUTING: 'EXECUTING',
        CANCELLED: 'CANCELLED',
      },
    },
    CANCELLED: {
      on: {
        REOPENED: 'REOPENED',
        ARCHIVED: 'ARCHIVED',
      },
    },
  },
});

/* =========================================================================
   2. Action Lifecycle State Machine (XState v5)
   Transitions:
   NOT_STARTED → IN_PROGRESS → [COMPLETED | BLOCKED | OVERDUE | CANCELLED]
   ========================================================================= */

export const actionSetup = setup({
  types: {
    context: {} as LifecycleContext,
    events: {} as { type: string; projectContext?: ProjectContext; ctx?: ProjectContext },
  },
});

export const actionMachine = actionSetup.createMachine({
  id: 'action',
  initial: 'NOT_STARTED',
  states: {
    NOT_STARTED: {
      on: {
        IN_PROGRESS: 'IN_PROGRESS',
        CANCELLED: 'CANCELLED',
      },
    },
    IN_PROGRESS: {
      on: {
        COMPLETED: 'COMPLETED',
        BLOCKED: 'BLOCKED',
        OVERDUE: 'OVERDUE',
        CANCELLED: 'CANCELLED',
      },
    },
    BLOCKED: {
      on: {
        IN_PROGRESS: 'IN_PROGRESS',
        OVERDUE: 'OVERDUE',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
      },
    },
    OVERDUE: {
      on: {
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        BLOCKED: 'BLOCKED',
        CANCELLED: 'CANCELLED',
      },
    },
    COMPLETED: {
      on: {
        IN_PROGRESS: 'IN_PROGRESS',
        CANCELLED: 'CANCELLED',
      },
    },
    CANCELLED: {
      on: {
        NOT_STARTED: 'NOT_STARTED',
        IN_PROGRESS: 'IN_PROGRESS',
      },
    },
  },
});

/* =========================================================================
   3. Generic Transition Guard Helper: canGo(machine, from, to, context?)
   ========================================================================= */

/**
 * Checks whether a lifecycle transition from `from` to `to` is allowed by the machine.
 * Supports both canonical uppercase codes and Korean labels transparently.
 */
export function canGo(
  machine: AnyStateMachine | any,
  from?: string | null,
  to?: string | null,
  context?: Partial<ProjectContext>
): boolean {
  if (!from || !to) return false;

  const isDecision = machine?.id === 'decision' || machine === decisionMachine;
  const isAction = machine?.id === 'action' || machine === actionMachine;

  const canonicalFrom = isDecision
    ? toCanonicalDecisionStatus(from)
    : isAction
    ? toCanonicalActionStatus(from)
    : String(from).trim().toUpperCase();

  const canonicalTo = isDecision
    ? toCanonicalDecisionStatus(to)
    : isAction
    ? toCanonicalActionStatus(to)
    : String(to).trim().toUpperCase();

  try {
    const snapshot = machine.resolveState({ value: canonicalFrom });
    return snapshot.can({
      type: canonicalTo,
      projectContext: context,
      ctx: context,
    });
  } catch {
    return false;
  }
}

/**
 * Convenience helper for Decision transitions
 */
export function canGoDecision(
  from?: DecisionStatus | string | null,
  to?: DecisionStatus | string | null,
  context?: Partial<ProjectContext>
): boolean {
  return canGo(decisionMachine, from, to, context);
}

/**
 * Convenience helper for Action transitions
 */
export function canGoAction(
  from?: ActionStatus | string | null,
  to?: ActionStatus | string | null,
  context?: Partial<ProjectContext>
): boolean {
  return canGo(actionMachine, from, to, context);
}
