import { BadRequestException } from '@nestjs/common';
import { DealStage } from '@prisma/client';
import { assertStageTransition, isTerminalStage } from './deal-stage.rules';

const OPEN_STAGES = [
  DealStage.LEAD,
  DealStage.BRIEF,
  DealStage.PROPOSAL,
  DealStage.CONTRACT,
  DealStage.IN_PROGRESS,
  DealStage.DELIVERY,
];

describe('isTerminalStage', () => {
  it.each([DealStage.WON, DealStage.LOST])('treats %s as terminal', (stage) => {
    expect(isTerminalStage(stage)).toBe(true);
  });

  it.each(OPEN_STAGES)('treats %s as open', (stage) => {
    expect(isTerminalStage(stage)).toBe(false);
  });
});

describe('assertStageTransition', () => {
  it('allows any move between open stages, in both directions', () => {
    for (const from of OPEN_STAGES) {
      for (const to of OPEN_STAGES) {
        if (from === to) continue;
        expect(() => assertStageTransition(from, to)).not.toThrow();
      }
    }
  });

  it.each(OPEN_STAGES)('allows closing as WON from %s', (from) => {
    expect(() => assertStageTransition(from, DealStage.WON)).not.toThrow();
  });

  it.each(OPEN_STAGES)('allows closing as LOST from %s when a reason is given', (from) => {
    expect(() =>
      assertStageTransition(from, DealStage.LOST, 'Выбрали другого подрядчика'),
    ).not.toThrow();
  });

  it('rejects closing as LOST without a reason', () => {
    expect(() => assertStageTransition(DealStage.PROPOSAL, DealStage.LOST)).toThrow(
      BadRequestException,
    );
  });

  it('rejects closing as LOST with a blank reason', () => {
    expect(() => assertStageTransition(DealStage.PROPOSAL, DealStage.LOST, '   ')).toThrow(
      BadRequestException,
    );
  });

  it('does not require a reason for WON', () => {
    expect(() => assertStageTransition(DealStage.DELIVERY, DealStage.WON)).not.toThrow();
  });

  it('rejects a transition to the same stage', () => {
    expect(() => assertStageTransition(DealStage.BRIEF, DealStage.BRIEF)).toThrow(
      BadRequestException,
    );
  });

  it.each([DealStage.WON, DealStage.LOST])('refuses to move a %s deal anywhere', (from) => {
    for (const to of [...OPEN_STAGES, DealStage.WON, DealStage.LOST]) {
      expect(() => assertStageTransition(from, to, 'reason')).toThrow(BadRequestException);
    }
  });
});
