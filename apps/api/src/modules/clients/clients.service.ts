import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Client, Prisma } from '@prisma/client';
import { ResourceAccessService } from '../../common/access/resource-access.service';
import { paginated, Paginated } from '../../common/dto/paginated';
import { SAFE_USER_SELECT, SafeUser } from '../../common/types/user.types';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const CLIENT_LIST_INCLUDE = {
  owner: { select: SAFE_USER_SELECT },
  _count: { select: { deals: true } },
} satisfies Prisma.ClientInclude;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ResourceAccessService,
    private readonly activity: ActivityService,
  ) {}

  async list(query: ListClientsQueryDto): Promise<Paginated<Client>> {
    const where: Prisma.ClientWhereInput = {
      ...(query.source ? { source: query.source } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search
        ? {
            OR: [
              { companyName: { contains: query.search, mode: 'insensitive' } },
              { contactName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: CLIENT_LIST_INCLUDE,
      }),
      this.prisma.client.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        owner: { select: SAFE_USER_SELECT },
        deals: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, amount: true, stage: true, createdAt: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: SAFE_USER_SELECT } },
        },
      },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async create(dto: CreateClientDto, actor: SafeUser): Promise<Client> {
    const ownerId = await this.access.resolveOwnerId(actor, dto.ownerId);
    return this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({ data: { ...dto, ownerId } });
      await this.activity.record(
        {
          type: ActivityType.CLIENT_CREATED,
          payload: { companyName: client.companyName },
          clientId: client.id,
          userId: actor.id,
        },
        tx,
      );
      return client;
    });
  }

  async update(id: string, dto: UpdateClientDto, actor: SafeUser): Promise<Client> {
    await this.access.assertCanMutate('client', id, actor);
    const ownerId =
      dto.ownerId === undefined ? undefined : await this.access.resolveOwnerId(actor, dto.ownerId);
    return this.prisma.client.update({ where: { id }, data: { ...dto, ownerId } });
  }

  async remove(id: string, actor: SafeUser): Promise<void> {
    await this.access.assertCanMutate('client', id, actor);
    await this.prisma.client.delete({ where: { id } });
  }
}
