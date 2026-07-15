import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClientSource } from '@prisma/client';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const CLIENT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'companyName',
  'contactName',
  'email',
] as const;
export type ClientSortField = (typeof CLIENT_SORT_FIELDS)[number];

export class ListClientsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CLIENT_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(CLIENT_SORT_FIELDS)
  sortBy: ClientSortField = 'createdAt';

  @ApiPropertyOptional({
    description: 'Case-insensitive search over companyName, contactName, email',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: ClientSource })
  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerId?: string;
}
