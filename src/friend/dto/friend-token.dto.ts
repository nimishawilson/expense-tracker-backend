import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FriendTokenDto {
  @ApiProperty({ description: 'Token from the friend request email link' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;
}
