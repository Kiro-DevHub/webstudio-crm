import { Module } from '@nestjs/common';
import { AccessModule } from '../../common/access/access.module';
import { ActivityModule } from '../activity/activity.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AccessModule, ActivityModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
