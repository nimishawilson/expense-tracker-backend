import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExpenseParticipantResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 2 })
  userId: number;

  @ApiProperty({
    example: '16.67',
    description: 'Computed amount owed by this participant',
  })
  shareAmount: string;

  @ApiPropertyOptional({
    example: '33.33',
    description:
      'Raw input the share was derived from (percentage, exact amount, or share weight); null for EQUAL',
    nullable: true,
  })
  inputValue: string | null;
}
