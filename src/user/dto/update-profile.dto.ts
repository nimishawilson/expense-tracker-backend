import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Name must contain only alphabets and spaces',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'defaultCurrency must be a 3-letter ISO currency code',
  })
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  timeZone?: string;
}
