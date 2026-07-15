import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** 100 million roubles in kopecks — a sanity ceiling for a web studio deal. */
const MAX_AMOUNT_KOPECKS = 10_000_000_000;

export class CreateDealDto {
  @ApiProperty({ example: 'Корпоративный сайт для ООО «Вектор»' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 15_000_000,
    description: 'Amount in kopecks (minor units), never floats',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_AMOUNT_KOPECKS)
  amount!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({ example: '2026-09-30T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  expectedCloseDate!: Date;

  @ApiPropertyOptional({
    description: 'Defaults to the current user. Only an ADMIN may assign another owner.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerId?: string;
}
