import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../common/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Authenticated user profile',
  })
  user: UserResponseDto;
}
