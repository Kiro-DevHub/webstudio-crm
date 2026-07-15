import { Module } from '@nestjs/common';
import { AccessModule } from '../../common/access/access.module';
import { ActivityModule } from '../activity/activity.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [AccessModule, ActivityModule],
  controllers: [DealsController],
  providers: [DealsService],
})
export class DealsModule {}
