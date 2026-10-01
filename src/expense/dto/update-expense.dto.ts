import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: 49.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ example: 'Team lunch' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: '2026-09-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Id of a default or owned custom category',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Who paid for the expense',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  paidById?: number;

  // @ValidateIf, not @IsOptional(): IsOptional treats null the same as
  // undefined and skips validation for both, which let an explicit
  // `splitType: null` slip through unchecked. Rejecting null outright keeps
  // "clearing a split via PATCH" unsupported, as designed, instead of
  // silently corrupting participant state.
  @ApiPropertyOptional({ enum: SplitType, example: SplitType.EQUAL })
  @ValidateIf((o: UpdateExpenseDto) => o.splitType !== undefined)
  @IsEnum(SplitType)
  @SplitConsistency()
  splitType?: SplitType;

  @ApiPropertyOptional({ type: [ExpenseParticipantInputDto] })
  @ValidateIf((o: UpdateExpenseDto) => o.splitType !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseParticipantInputDto)
  participants?: ExpenseParticipantInputDto[];
}
