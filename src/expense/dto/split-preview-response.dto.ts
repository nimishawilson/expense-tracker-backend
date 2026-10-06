import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SplitType } from '../../../generated/prisma/client';

export class SplitPreviewParticipantDto {
  @ApiProperty({ example: 2 })
  userId: number;

  @ApiProperty({
    example: '60.00',
    description: 'Amount this participant would owe',
  })
  shareAmount: string;

  @ApiPropertyOptional({
    example: '60.00',
    description:
      'Raw input the share was derived from (percentage, exact amount, or share weight); null for EQUAL',
    nullable: true,
  })
  inputValue: string | null;
}

export class SplitPreviewResponseDto {
  @ApiProperty({ example: '100.00' })
  amount: string;

  @ApiProperty({ enum: SplitType })
  splitType: SplitType;

  @ApiProperty({ type: [SplitPreviewParticipantDto] })
  participants: SplitPreviewParticipantDto[];
}
