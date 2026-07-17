import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Deal, DealStage, Prisma } from '@prisma/client';
import { ResourceAccessService } from '../../common/access/resource-access.service';
import { paginated, Paginated } from '../../common/dto/paginated';
import { SAFE_USER_SELECT, SafeUser } from '../../common/types/user.types';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { assertStageTransition, isTerminalStage } from './deal-stage.rules';
import { BoardQueryDto } from './dto/board-query.dto';
import { ChangeDealStageDto } from './dto/change-deal-stage.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { ListDealsQueryDto } from './dto/list-deals-query.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

const DEAL_LIST_INCLUDE = {
  client: { select: { id: true, companyName: true } },
  owner: { select: SAFE_USER_SELECT },
} satisfies Prisma.DealInclude;

const OPEN_STAGES: readonly DealStage[] = [
  DealStage.LEAD,
  DealStage.BRIEF,
  DealStage.PROPOSAL,
  DealStage.CONTRACT,
  DealStage.IN_PROGRESS,
  DealStage.DELIVERY,
];

function searchWhere(search: string | undefined): Prisma.DealWhereInput {
  if (search === undefined || search.trim() === '') return {};
  const contains = { contains: search.trim(), mode: 'insensitive' as const };
  return { OR: [{ title: contains }, { client: { companyName: contains } }] };
}

export interface BoardClosedSummary {
  count: number;
  amount: number;
}

export interface DealsBoard {
  deals: Deal[];
  closed: { won: BoardClosedSummary; lost: BoardClosedSummary };
}

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ResourceAccessService,
    private readonly activity: ActivityService,
  ) {}

  async list(query: ListDealsQueryDto): Promise<Paginated<Deal>> {
    const amount =
      query.amountMin !== undefined || query.amountMax !== undefined
        ? {
            ...(query.amountMin !== undefined ? { gte: query.amountMin } : {}),
            ...(query.amountMax !== undefined ? { lte: query.amountMax } : {}),
          }
        : undefined;

    const where: Prisma.DealWhereInput = {
      ...(query.stage ? { stage: query.stage } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(amount ? { amount } : {}),
      ...searchWhere(query.search),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: DEAL_LIST_INCLUDE,
      }),
      this.prisma.deal.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  /**
   * The kanban board: every open deal in one response (a studio pipeline is small enough
   * to skip pagination), each with an overdue-task count, plus WON/LOST totals for the
   * closed drop zones. All three reads share the same filters.
   */
  async board(query: BoardQueryDto): Promise<DealsBoard> {
    const filters: Prisma.DealWhereInput = {
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...searchWhere(query.search),
    };

    // Promise.all, not $transaction: groupBy loses its result type inside the array form,
    // and two snapshot reads for a dashboard don't need transactional consistency anyway.
    const [deals, closedGroups] = await Promise.all([
      this.prisma.deal.findMany({
        where: { ...filters, stage: { in: [...OPEN_STAGES] } },
        orderBy: { createdAt: 'desc' },
        include: {
          ...DEAL_LIST_INCLUDE,
          _count: {
            select: {
              tasks: {
                where: { status: { not: 'DONE' }, dueDate: { lt: new Date() } },
              },
            },
          },
        },
      }),
      this.prisma.deal.groupBy({
        by: ['stage'],
        where: { ...filters, stage: { in: [DealStage.WON, DealStage.LOST] } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const summary = (stage: DealStage): BoardClosedSummary => {
      const group = closedGroups.find((item) => item.stage === stage);
      return { count: group?._count._all ?? 0, amount: group?._sum.amount ?? 0 };
    };

    return {
      deals,
      closed: { won: summary(DealStage.WON), lost: summary(DealStage.LOST) },
    };
  }

  /** The deal card: everything the detail page shows, activities newest-first. */
  async findOne(id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        client: true,
        owner: { select: SAFE_USER_SELECT },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: { assignee: { select: SAFE_USER_SELECT } },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: SAFE_USER_SELECT } },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: SAFE_USER_SELECT } },
        },
      },
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    return deal;
  }

  async create(dto: CreateDealDto, actor: SafeUser): Promise<Deal> {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    const ownerId = await this.access.resolveOwnerId(actor, dto.ownerId);

    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({ data: { ...dto, ownerId } });
      await this.activity.record(
        {
          type: ActivityType.DEAL_CREATED,
          payload: { title: deal.title, amount: deal.amount },
          dealId: deal.id,
          clientId: deal.clientId,
          userId: actor.id,
        },
        tx,
      );
      return deal;
    });
  }

  async update(id: string, dto: UpdateDealDto, actor: SafeUser): Promise<Deal> {
    await this.access.assertCanMutate('deal', id, actor);
    const ownerId =
      dto.ownerId === undefined ? undefined : await this.access.resolveOwnerId(actor, dto.ownerId);
    return this.prisma.deal.update({ where: { id }, data: { ...dto, ownerId } });
  }

  async remove(id: string, actor: SafeUser): Promise<void> {
    await this.access.assertCanMutate('deal', id, actor);
    await this.prisma.deal.delete({ where: { id } });
  }

  /**
   * The only way a deal changes stage: validated by deal-stage.rules, stamped with
   * closedAt on WON/LOST, and always logged as STAGE_CHANGED { from, to }.
   */
  async changeStage(id: string, dto: ChangeDealStageDto, actor: SafeUser): Promise<Deal> {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      select: { stage: true, ownerId: true, clientId: true },
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    this.access.assertOwnership(actor, deal.ownerId);
    assertStageTransition(deal.stage, dto.stage, dto.lostReason);

    const closing = isTerminalStage(dto.stage);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id },
        data: {
          stage: dto.stage,
          closedAt: closing ? new Date() : null,
          lostReason: dto.stage === DealStage.LOST ? (dto.lostReason?.trim() ?? null) : null,
        },
      });
      await this.activity.record(
        {
          type: ActivityType.STAGE_CHANGED,
          payload: { from: deal.stage, to: dto.stage },
          dealId: id,
          clientId: deal.clientId,
          userId: actor.id,
        },
        tx,
      );
      return updated;
    });
  }
}
