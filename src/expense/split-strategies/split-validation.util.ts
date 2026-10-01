import { BadRequestException } from '@nestjs/common';
import { SplitParticipantInput } from './split-strategy.interface';

export function assertValidParticipantList(
  participants: SplitParticipantInput[],
): void {
  if (participants.length === 0) {
    throw new BadRequestException(
      'At least one participant is required for a split expense',
    );
  }

  const ids = participants.map((p) => p.userId);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new BadRequestException(
      `Duplicate participant userId(s): ${[...new Set(duplicates)].join(', ')}`,
    );
  }
}
