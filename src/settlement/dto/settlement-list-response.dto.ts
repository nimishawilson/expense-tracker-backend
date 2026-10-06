import { ApiProperty } from '@nestjs/swagger';
import { SettlementResponseDto } from './settlement-response.dto';

export class SettlementListResponseDto {
  @ApiProperty({ type: [SettlementResponseDto] })
  data: SettlementResponseDto[];

  @ApiProperty({ example: 5, description: 'Total matching settlements' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
