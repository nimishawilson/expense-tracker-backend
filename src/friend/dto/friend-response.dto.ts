import { ApiProperty } from '@nestjs/swagger';

export class FriendResponseDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'Bob Smith' })
  name: string;

  @ApiProperty({ example: 'bob@example.com' })
  email: string;

  @ApiProperty({ description: 'When the friendship was created' })
  since: Date;
}

export class FriendListResponseDto {
  @ApiProperty({ type: [FriendResponseDto] })
  data: FriendResponseDto[];

  @ApiProperty({ example: 1 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
