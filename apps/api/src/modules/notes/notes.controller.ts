import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Note } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SafeUser } from '../../common/types/user.types';
import { CreateNoteDto } from './dto/create-note.dto';
import { NotesService } from './notes.service';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('deals/:dealId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a note to a deal (writes a NOTE_ADDED activity)' })
  create(
    @Param('dealId') dealId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<Note> {
    return this.notesService.create(dealId, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note from a deal (author or ADMIN)' })
  remove(
    @Param('dealId') dealId: string,
    @Param('id') id: string,
    @CurrentUser() actor: SafeUser,
  ): Promise<void> {
    return this.notesService.remove(dealId, id, actor);
  }
}
