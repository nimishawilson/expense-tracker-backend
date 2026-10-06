import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { FriendRequestStatus } from '../../../generated/prisma/client';

export enum FriendRequestDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export class FriendRequestQueryDto {
  @ApiPropertyOptional({
    enum: FriendRequestDirection,
    default: FriendRequestDirection.INCOMING,
  })
  @IsOptional()
  @IsEnum(FriendRequestDirection)
  direction?: FriendRequestDirection = FriendRequestDirection.INCOMING;

  @ApiPropertyOptional({
    enum: FriendRequestStatus,
    description:
      'Defaults to PENDING for incoming requests (expired ones are hidden) and to all statuses for outgoing',
  })
  @IsOptional()
  @IsEnum(FriendRequestStatus)
  status?: FriendRequestStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
