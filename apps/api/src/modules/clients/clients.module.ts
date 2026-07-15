import { Module } from '@nestjs/common';
import { AccessModule } from '../../common/access/access.module';
import { ActivityModule } from '../activity/activity.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [AccessModule, ActivityModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
