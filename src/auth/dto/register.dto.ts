import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { Match } from '../../common/validators/match.decorator';

export class RegisterDto {
  @ApiProperty({
    example: 'Jane Doe',
    description: 'Full name, letters and spaces only',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Name must contain only alphabets and spaces',
  })
  name: string;

  @ApiProperty({
    example: 'jane@example.com',
    description: 'Valid, unique email address',
  })
  @IsEmail()
  email: string;

  // Spec: "minimum of 6, no upper cap.
  @ApiProperty({
    example: 'Secret123',
    description: 'Password, minimum 6 characters',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Secret123',
    description: 'Must match password',
  })
  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
