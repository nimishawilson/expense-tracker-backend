import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSettlementDto {
  @ApiProperty({ example: 2, description: 'User id the money is coming from' })
  @IsInt()
  @IsPositive()
  fromUserId: number;

  @ApiProperty({ example: 1, description: 'User id the money is going to' })
  @IsInt()
  @IsPositive()
  toUserId: number;

  @ApiProperty({ example: 25.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'Paid back via UPI' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
