import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface RecordActivityInput {
  type: ActivityType;
  /** Who performed the action. */
  userId: string;
  dealId?: string | null;
  clientId?: string | null;
  /** Event details, e.g. { from, to } for STAGE_CHANGED. */
  payload?: Prisma.InputJsonValue;
}

/**
 * The activity log writer. CLAUDE.md requires an Activity for every deal creation,
 * stage change, task completion and note — this is the only place that writes them,
 * and it takes a transaction client so a log entry can never outlive a rolled-back
 * entity (or go missing after a committed one).
 */
@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    input: RecordActivityInput,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await tx.activity.create({
      data: {
        type: input.type,
        payload: input.payload ?? {},
        userId: input.userId,
        dealId: input.dealId ?? null,
        clientId: input.clientId ?? null,
      },
    });
  }
}
