import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Full name, letters and spaces only',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Name must contain only alphabets and spaces',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'EUR',
    description: '3-letter ISO currency code',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'defaultCurrency must be a 3-letter ISO currency code',
  })
  defaultCurrency?: string;

  @ApiPropertyOptional({
    example: 'Europe/London',
    description: 'IANA time zone identifier',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  timeZone?: string;
}
