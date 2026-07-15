import { Module } from '@nestjs/common';
import { AccessModule } from '../../common/access/access.module';
import { ActivityModule } from '../activity/activity.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [AccessModule, ActivityModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
