import { ApiPropertyOptional } from '@nestjs/swagger';
import { DealStage } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const DEAL_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'amount',
  'title',
  'expectedCloseDate',
  'closedAt',
] as const;
export type DealSortField = (typeof DEAL_SORT_FIELDS)[number];

export class ListDealsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DEAL_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(DEAL_SORT_FIELDS)
  sortBy: DealSortField = 'createdAt';

  @ApiPropertyOptional({ enum: DealStage })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Minimum amount in kopecks, inclusive' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountMin?: number;

  @ApiPropertyOptional({ description: 'Maximum amount in kopecks, inclusive' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountMax?: number;
}
