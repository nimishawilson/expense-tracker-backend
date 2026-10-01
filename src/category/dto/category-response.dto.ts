import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Groceries' })
  name: string;

  @ApiPropertyOptional({ example: '🛒', nullable: true })
  icon: string | null;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'Owning user id; null for default/global categories',
  })
  userId: number | null;

  @ApiProperty({ example: '2026-09-20T10:30:00.000Z', type: Date })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-20T10:30:00.000Z', type: Date })
  updatedAt: Date;
}
