import { PrismaService } from '../../prisma/prisma.service';

/** Resources whose ownership can be resolved from an id alone. */
export type ResourceKind = 'client' | 'deal' | 'task';

interface ResourceDefinition {
  /** Name used in "<label> not found" errors. */
  readonly label: string;
  /** Reads only the owner of a resource; null when the resource does not exist. */
  readonly loadOwnerId: (prisma: PrismaService, id: string) => Promise<string | null>;
}

/**
 * The single place that knows who "owns" each resource: clients and deals carry an
 * explicit ownerId, a task belongs to its assignee. Add a resource here and the
 * owner-or-ADMIN rule applies to it without touching ResourceAccessService.
 */
export const OWNED_RESOURCES: Record<ResourceKind, ResourceDefinition> = {
  client: {
    label: 'Client',
    loadOwnerId: async (prisma, id) =>
      (await prisma.client.findUnique({ where: { id }, select: { ownerId: true } }))?.ownerId ??
      null,
  },
  deal: {
    label: 'Deal',
    loadOwnerId: async (prisma, id) =>
      (await prisma.deal.findUnique({ where: { id }, select: { ownerId: true } }))?.ownerId ?? null,
  },
  task: {
    label: 'Task',
    loadOwnerId: async (prisma, id) =>
      (await prisma.task.findUnique({ where: { id }, select: { assigneeId: true } }))?.assigneeId ??
      null,
  },
};
