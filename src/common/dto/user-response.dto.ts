import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'Unique identifier of the user' })
  id: number;

  @ApiProperty({ example: 'Jane Doe', description: "User's full name" })
  name: string;

  @ApiProperty({
    example: 'jane@example.com',
    description: "User's email address",
  })
  email: string;

  @ApiProperty({
    example: 'USD',
    description: '3-letter ISO currency code',
  })
  defaultCurrency: string;

  @ApiProperty({
    example: 'UTC',
    description: "User's IANA time zone",
  })
  timeZone: string;

  @ApiProperty({
    example: '2026-01-15T10:30:00.000Z',
    description: 'Account creation timestamp',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-20T08:12:00.000Z',
    description: 'Last update timestamp',
    type: Date,
  })
  updatedAt: Date;
}
