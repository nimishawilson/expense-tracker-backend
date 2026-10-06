import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FriendRequestStatus } from '../../../generated/prisma/client';

export class FriendRequestSenderDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;
}

export class FriendRequestResponseDto {
  @ApiProperty({ example: 4 })
  id: number;

  @ApiProperty({ example: 'bob@example.com' })
  receiverEmail: string;

  @ApiProperty({ enum: FriendRequestStatus })
  status: FriendRequestStatus;

  @ApiProperty({
    description: 'True when the request is still PENDING but past its expiry',
  })
  expired: boolean;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastSentAt: Date;

  @ApiPropertyOptional({
    type: FriendRequestSenderDto,
    description: 'Included on incoming requests',
  })
  sender?: FriendRequestSenderDto;
}

export class FriendRequestListResponseDto {
  @ApiProperty({ type: [FriendRequestResponseDto] })
  data: FriendRequestResponseDto[];

  @ApiProperty({
    example: 2,
    description: 'Total matches; use as a badge count',
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class FriendRequestTokenDetailsDto {
  @ApiProperty({ example: 'Jane Doe' })
  senderName: string;

  @ApiProperty({ example: 'bob@example.com' })
  receiverEmail: string;

  @ApiProperty({ enum: FriendRequestStatus })
  status: FriendRequestStatus;

  @ApiProperty()
  expired: boolean;

  @ApiProperty({
    description:
      'Whether an account exists for receiverEmail; if false, route the user to registration first',
  })
  recipientRegistered: boolean;
}
