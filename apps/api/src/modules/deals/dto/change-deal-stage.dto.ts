import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStage } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangeDealStageDto {
  @ApiProperty({ enum: DealStage, example: DealStage.PROPOSAL })
  @IsEnum(DealStage)
  stage!: DealStage;

  @ApiPropertyOptional({
    example: 'Выбрали другого подрядчика',
    description: 'Required when moving to LOST, ignored otherwise',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  lostReason?: string;
}
