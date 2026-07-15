import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Клиент готов подписывать договор на следующей неделе.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body!: string;
}
