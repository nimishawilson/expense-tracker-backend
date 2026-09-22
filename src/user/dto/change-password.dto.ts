import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../common/validators/match.decorator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;

  @IsString()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmNewPassword: string;
}
