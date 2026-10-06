import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryResponseDto {
  @ApiProperty({ example: '2026-09' })
  month: string;

  @ApiProperty({
    example: 'Asia/Kolkata',
    description: 'Time zone used to determine the month boundaries',
  })
  timeZone: string;

  @ApiProperty({
    example: '2026-08-31T18:30:00.000Z',
    description: 'Inclusive start of the month',
  })
  from: string;

  @ApiProperty({
    example: '2026-09-30T18:30:00.000Z',
    description: 'Exclusive end of the month',
  })
  to: string;

  @ApiProperty({ example: 'USD', description: "User's default currency" })
  currency: string;

  @ApiProperty({
    example: '182.50',
    description:
      "The user's own spend for the month: full amount of unsplit expenses they own, plus their share of split expenses they participate in",
  })
  totalSpent: string;
}
