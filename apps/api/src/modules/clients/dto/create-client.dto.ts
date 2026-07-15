import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientSource } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'ООО «Вектор»' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  companyName!: string;

  @ApiProperty({ example: 'Иван Петров' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contactName!: string;

  @ApiProperty({ example: 'ivan@vector.ru' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+7 999 123-45-67' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

  @ApiProperty({ enum: ClientSource, example: ClientSource.WEBSITE })
  @IsEnum(ClientSource)
  source!: ClientSource;

  @ApiPropertyOptional({
    description: 'Defaults to the current user. Only an ADMIN may assign another owner.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerId?: string;
}
