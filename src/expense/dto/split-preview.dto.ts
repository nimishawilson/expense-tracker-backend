import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { SplitType } from '../../../generated/prisma/client';
import { ExpenseParticipantInputDto } from './expense-participant-input.dto';

export class SplitPreviewDto {
  @ApiProperty({ example: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: SplitType, example: SplitType.PERCENTAGE })
  @IsEnum(SplitType)
  splitType: SplitType;

  @ApiProperty({ type: [ExpenseParticipantInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseParticipantInputDto)
  participants: ExpenseParticipantInputDto[];
}
