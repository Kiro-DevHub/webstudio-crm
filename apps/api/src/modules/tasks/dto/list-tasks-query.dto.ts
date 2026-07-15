import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const TASK_SORT_FIELDS = ['dueDate', 'createdAt', 'title', 'status'] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export class ListTasksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TASK_SORT_FIELDS, default: 'dueDate' })
  @IsOptional()
  @IsIn(TASK_SORT_FIELDS)
  sortBy: TaskSortField = 'dueDate';

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dealId?: string;

  @ApiPropertyOptional({
    description: 'Only tasks past their dueDate that are not DONE yet',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  overdue?: boolean;
}
