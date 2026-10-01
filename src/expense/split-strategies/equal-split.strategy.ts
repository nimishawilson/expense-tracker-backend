import { BadRequestException } from '@nestjs/common';
import { Prisma, SplitType } from '../../../generated/prisma/client';
import { distributeWithLargestRemainder } from './remainder.util';
import { assertValidParticipantList } from './split-validation.util';
import {
  ComputedParticipantShare,
  SplitParticipantInput,
  SplitStrategy,
} from './split-strategy.interface';

export class EqualSplitStrategy implements SplitStrategy {
  readonly type = SplitType.EQUAL;

  compute(
    totalAmount: Prisma.Decimal,
    participants: SplitParticipantInput[],
  ): ComputedParticipantShare[] {
    assertValidParticipantList(participants);

    const withValue = participants.filter((p) => p.value !== undefined);
    if (withValue.length > 0) {
      throw new BadRequestException(
        'value must not be provided for participants in an EQUAL split',
      );
    }

    const idealShare = totalAmount.dividedBy(participants.length);
    const shares = distributeWithLargestRemainder(
      totalAmount,
      participants.map((p) => ({ userId: p.userId, idealShare })),
    );

    return participants.map((p) => ({
      userId: p.userId,
      shareAmount: shares.get(p.userId)!,
      inputValue: null,
    }));
  }
}
