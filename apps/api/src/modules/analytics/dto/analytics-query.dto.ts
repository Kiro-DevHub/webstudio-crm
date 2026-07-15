import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Shared query for every analytics endpoint: an ISO date range (half-open
 * `[from, to)`, defaulting to the last 6 months) plus an ADMIN-only owner filter.
 */
export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Period start (ISO 8601, inclusive). Defaults to `to` minus 6 months.',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Period end (ISO 8601, exclusive). Defaults to now.',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter by deal owner (ADMIN only)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerId?: string;
}
