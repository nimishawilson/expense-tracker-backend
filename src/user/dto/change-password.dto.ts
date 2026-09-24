import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../common/validators/match.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldSecret123',
    description: "User's current password",
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecret456',
    description: 'New password, minimum 6 characters',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({
    example: 'NewSecret456',
    description: 'Must match newPassword',
  })
  @IsString()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmNewPassword: string;
}
