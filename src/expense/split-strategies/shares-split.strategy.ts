import { BadRequestException } from '@nestjs/common';
import { Prisma, SplitType } from '../../../generated/prisma/client';
import { distributeWithLargestRemainder } from './remainder.util';
import { assertValidParticipantList } from './split-validation.util';
import {
  ComputedParticipantShare,
  SplitParticipantInput,
  SplitStrategy,
} from './split-strategy.interface';

export class SharesSplitStrategy implements SplitStrategy {
  readonly type = SplitType.SHARES;

  compute(
    totalAmount: Prisma.Decimal,
    participants: SplitParticipantInput[],
  ): ComputedParticipantShare[] {
    assertValidParticipantList(participants);

    for (const p of participants) {
      if (p.value === undefined || p.value <= 0) {
        throw new BadRequestException(
          `A positive share weight is required for participant ${p.userId} in a SHARES split`,
        );
      }
    }

    const values = participants.map((p) => new Prisma.Decimal(p.value!));
    const totalShares = values.reduce(
      (acc, v) => acc.plus(v),
      new Prisma.Decimal(0),
    );

    const shares = distributeWithLargestRemainder(
      totalAmount,
      participants.map((p, i) => ({
        userId: p.userId,
        idealShare: totalAmount.times(values[i]).dividedBy(totalShares),
      })),
    );

    return participants.map((p, i) => ({
      userId: p.userId,
      shareAmount: shares.get(p.userId)!,
      inputValue: values[i],
    }));
  }
}
