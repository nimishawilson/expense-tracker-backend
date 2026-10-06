import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserSummaryDto } from '../../common/dto/user-summary.dto';

export class SettlementResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 2 })
  fromUserId: number;

  @ApiProperty({ type: UserSummaryDto })
  fromUser: UserSummaryDto;

  @ApiProperty({ example: 1 })
  toUserId: number;

  @ApiProperty({ type: UserSummaryDto })
  toUser: UserSummaryDto;

  @ApiProperty({ example: '25.00' })
  amount: string;

  @ApiPropertyOptional({ example: 'Paid back via UPI', nullable: true })
  note: string | null;

  @ApiProperty({ example: '2026-09-20T10:30:00.000Z', type: Date })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-20T10:30:00.000Z', type: Date })
  updatedAt: Date;
}
