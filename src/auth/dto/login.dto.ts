import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'jane@example.com',
    description: 'Registered email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Secret123',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
