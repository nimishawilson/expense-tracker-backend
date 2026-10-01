import { ApiProperty } from '@nestjs/swagger';
import { BalanceEntryDto } from './balance-entry.dto';

export class BalancesResponseDto {
  @ApiProperty({ example: '0.00' })
  totalYouOwe: string;

  @ApiProperty({ example: '15.50' })
  totalYouAreOwed: string;

  @ApiProperty({
    example: '15.50',
    description: 'totalYouAreOwed - totalYouOwe',
  })
  netBalance: string;

  @ApiProperty({ type: [BalanceEntryDto] })
  breakdown: BalanceEntryDto[];
}
