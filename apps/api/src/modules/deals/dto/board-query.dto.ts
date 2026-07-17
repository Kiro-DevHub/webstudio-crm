import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Filters for the kanban board — the board is never paginated, so no PaginationQueryDto here. */
export class BoardQueryDto {
  @ApiPropertyOptional({ description: 'Case-insensitive search over title and client companyName' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

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
}
