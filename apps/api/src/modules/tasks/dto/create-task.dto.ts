import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Подготовить коммерческое предложение' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Учесть скидку 10% за предоплату' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '2026-08-01T12:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  dueDate!: Date;

  @ApiPropertyOptional({ description: 'Attaches the task to a deal; omit for a standalone task' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dealId?: string;

  @ApiPropertyOptional({
    description: 'Defaults to the current user. Only an ADMIN may assign another user.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assigneeId?: string;
}
