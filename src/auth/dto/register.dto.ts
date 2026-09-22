import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { Match } from '../../common/validators/match.decorator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Name must contain only alphabets and spaces',
  })
  name: string;

  @IsEmail()
  email: string;

  // Spec: "minimum of 6, no upper cap.
  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
