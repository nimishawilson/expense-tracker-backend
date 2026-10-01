import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class ExpenseParticipantInputDto {
  @ApiProperty({ example: 2, description: 'User id of the participant' })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiPropertyOptional({
    example: 25,
    description:
      'Percentage (PERCENTAGE split), exact amount (EXACT split), or share weight (SHARES split). Must be omitted for EQUAL.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value?: number;
}
