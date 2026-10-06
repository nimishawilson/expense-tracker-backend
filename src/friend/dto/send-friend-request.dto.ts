import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({
    example: 'bob@example.com',
    description:
      'Email of the person to add. They do not need an account yet; the response is the same either way.',
  })
  @IsEmail()
  @MaxLength(254)
  email: string;
}
