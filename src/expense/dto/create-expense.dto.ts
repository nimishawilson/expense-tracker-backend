import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SplitType } from '../../../generated/prisma/client';
import { SplitConsistency } from '../validators/split-consistency.decorator';
import { ExpenseParticipantInputDto } from './expense-participant-input.dto';

export class CreateExpenseDto {
  @ApiProperty({ example: 49.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Team lunch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: '2026-09-20T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 3,
    description: 'Id of a default or owned custom category',
  })
  @IsInt()
  @IsPositive()
  categoryId: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Who paid; defaults to the authenticated user',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  paidById?: number;

  // @ValidateIf, not @IsOptional(): IsOptional treats null the same as
  // undefined and skips validation for both, which would let an explicit
  // `splitType: null` slip through unchecked instead of being rejected.
  @ApiPropertyOptional({ enum: SplitType, example: SplitType.EQUAL })
  @ValidateIf((o: CreateExpenseDto) => o.splitType !== undefined)
  @IsEnum(SplitType)
  @SplitConsistency()
  splitType?: SplitType;

  @ApiPropertyOptional({ type: [ExpenseParticipantInputDto] })
  @ValidateIf((o: CreateExpenseDto) => o.splitType !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseParticipantInputDto)
  participants?: ExpenseParticipantInputDto[];
}
