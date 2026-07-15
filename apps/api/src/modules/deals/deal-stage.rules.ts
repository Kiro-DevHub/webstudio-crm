import { BadRequestException } from '@nestjs/common';
import { DealStage } from '@prisma/client';

const TERMINAL_STAGES: readonly DealStage[] = [DealStage.WON, DealStage.LOST];

/** WON and LOST are final: a closed deal keeps its history and never moves again. */
export function isTerminalStage(stage: DealStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}

/**
 * Validates a pipeline move, throwing BadRequestException when it is not allowed.
 *
 * Open stages may be reordered freely in both directions (the kanban board drops a
 * card anywhere), WON/LOST are reachable from any open stage, and a closed deal is
 * a dead end. LOST always carries a reason.
 */
export function assertStageTransition(from: DealStage, to: DealStage, lostReason?: string): void {
  if (isTerminalStage(from)) {
    throw new BadRequestException(`Deal is already closed as ${from} and cannot be moved to ${to}`);
  }
  if (from === to) {
    throw new BadRequestException(`Deal is already in stage ${to}`);
  }
  if (to === DealStage.LOST && !lostReason?.trim()) {
    throw new BadRequestException('lostReason is required when closing a deal as LOST');
  }
}
