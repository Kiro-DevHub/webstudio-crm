import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Note } from '@prisma/client';
import { ResourceAccessService } from '../../common/access/resource-access.service';
import { SAFE_USER_SELECT, SafeUser } from '../../common/types/user.types';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ResourceAccessService,
    private readonly activity: ActivityService,
  ) {}

  /** Anyone may comment on any deal; only the author (or an ADMIN) can take it back. */
  async create(dealId: string, dto: CreateNoteDto, actor: SafeUser): Promise<Note> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { clientId: true },
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: { body: dto.body, dealId, authorId: actor.id },
        include: { author: { select: SAFE_USER_SELECT } },
      });
      await this.activity.record(
        {
          type: ActivityType.NOTE_ADDED,
          payload: { noteId: note.id },
          dealId,
          clientId: deal.clientId,
          userId: actor.id,
        },
        tx,
      );
      return note;
    });
  }

  async remove(dealId: string, id: string, actor: SafeUser): Promise<void> {
    const note = await this.prisma.note.findUnique({
      where: { id },
      select: { dealId: true, authorId: true },
    });
    if (!note || note.dealId !== dealId) {
      throw new NotFoundException('Note not found');
    }
    this.access.assertOwnership(actor, note.authorId);
    await this.prisma.note.delete({ where: { id } });
  }
}
