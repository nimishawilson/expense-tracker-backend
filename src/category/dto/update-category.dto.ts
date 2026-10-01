import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Groceries' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    example: '🛒',
    description: 'Optional icon/emoji identifier',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;
}
