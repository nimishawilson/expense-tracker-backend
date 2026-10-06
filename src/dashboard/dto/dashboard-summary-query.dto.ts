import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class DashboardSummaryQueryDto {
  @ApiPropertyOptional({
    example: '2026-09',
    description:
      'Month to summarise as YYYY-MM, interpreted in the user time zone. Defaults to the current month.',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month?: string;
}
