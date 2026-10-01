import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SplitType } from '../../../generated/prisma/client';
import { ExpenseParticipantResponseDto } from './expense-participant-response.dto';

export class ExpenseResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '49.99' })
  amount: string;

  @ApiProperty({ example: 'Team lunch' })
  description: string;

  @ApiProperty({ example: '2026-09-20T00:00:00.000Z', type: Date })
  date: Date;

  @ApiProperty({ example: 3 })
  categoryId: number;

  @ApiProperty({ example: 1 })
  ownerId: number;

  @ApiProperty({ example: 1 })
  paidById: number;

  @ApiPropertyOptional({ enum: SplitType, nullable: true })
  splitType: SplitType | null;

  @ApiProperty({ type: [ExpenseParticipantResponseDto] })
  participants: ExpenseParticipantResponseDto[];

  @ApiProperty({ example: '2026-09-20T10:30:00.000Z', type: Date })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-20T10:30:00.000Z', type: Date })
  updatedAt: Date;
}
