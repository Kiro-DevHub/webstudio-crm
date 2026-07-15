import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

/** A task never moves between deals; setting status to DONE logs TASK_COMPLETED. */
export class UpdateTaskDto extends PartialType(OmitType(CreateTaskDto, ['dealId'] as const)) {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
