import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'manager@crm.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Мария Иванова' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72, { message: 'password must be at most 72 characters (bcrypt limit)' })
  password!: string;
}
