import { ApiProperty } from '@nestjs/swagger';
import { ExpenseResponseDto } from './expense-response.dto';

export class ExpenseListResponseDto {
  @ApiProperty({ type: [ExpenseResponseDto] })
  data: ExpenseResponseDto[];

  @ApiProperty({ example: 42, description: 'Total matching expenses' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
