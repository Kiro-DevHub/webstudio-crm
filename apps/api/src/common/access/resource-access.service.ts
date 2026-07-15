import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeUser } from '../types/user.types';
import { OWNED_RESOURCES, ResourceKind } from './owned-resources';

/**
 * The one implementation of the CLAUDE.md rule: a MANAGER may view everything but
 * only mutate what they own; an ADMIN may mutate anything.
 *
 * Every module goes through this service instead of re-deriving the rule, so the
 * definition of "owner" and the 403/404 behaviour stay in one place.
 */
@Injectable()
export class ResourceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guards a mutation addressed by id: 404 when the resource is gone, 403 when the
   * actor may not touch it. Use when the caller does not need the row itself.
   */
  async assertCanMutate(kind: ResourceKind, id: string, actor: SafeUser): Promise<void> {
    const { label, loadOwnerId } = OWNED_RESOURCES[kind];
    const ownerId = await loadOwnerId(this.prisma, id);
    if (ownerId === null) {
      throw new NotFoundException(`${label} not found`);
    }
    this.assertOwnership(actor, ownerId);
  }

  /**
   * Same rule for a resource the caller already loaded (e.g. a deal read for its
   * current stage), so the check costs no extra query.
   */
  assertOwnership(actor: SafeUser, ownerId: string): void {
    if (actor.role !== Role.ADMIN && actor.id !== ownerId) {
      throw new ForbiddenException('You can only modify records you own');
    }
  }

  /**
   * Resolves the owner of a resource being created or reassigned: defaults to the
   * actor, and only an ADMIN may hand a record to somebody else.
   */
  async resolveOwnerId(actor: SafeUser, requestedOwnerId?: string): Promise<string> {
    if (requestedOwnerId === undefined || requestedOwnerId === actor.id) {
      return actor.id;
    }
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only an admin can assign records to another user');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: requestedOwnerId },
      select: { isActive: true },
    });
    if (!target?.isActive) {
      throw new BadRequestException('Owner must be an active user');
    }
    return requestedOwnerId;
  }
}
