import { ApiProperty } from '@nestjs/swagger';

/** Minimal public view of another user: id and name only, never email. */
export class UserSummaryDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'Bob Smith' })
  name: string;
}
