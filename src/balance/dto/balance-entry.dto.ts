import { ApiProperty } from '@nestjs/swagger';

export class BalanceEntryDto {
  @ApiProperty({ example: 3 })
  counterpartUserId: number;

  @ApiProperty({ example: 'Bob Smith' })
  counterpartName: string;

  @ApiProperty({
    example: '0.00',
    description: 'Amount the current user owes this counterpart',
  })
  youOwe: string;

  @ApiProperty({
    example: '15.50',
    description: 'Amount this counterpart owes the current user',
  })
  youAreOwed: string;

  @ApiProperty({
    example: '15.50',
    description:
      'youAreOwed - youOwe; positive = counterpart owes you, negative = you owe them',
  })
  net: string;
}
