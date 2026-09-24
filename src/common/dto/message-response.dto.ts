import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    example: 'Password updated successfully',
    description: 'Human-readable result message',
  })
  message: string;
}
