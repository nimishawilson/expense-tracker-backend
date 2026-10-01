import { BadRequestException } from '@nestjs/common';
import { Prisma, SplitType } from '../../../generated/prisma/client';
import { distributeWithLargestRemainder } from './remainder.util';
import { assertValidParticipantList } from './split-validation.util';
import {
  ComputedParticipantShare,
  SplitParticipantInput,
  SplitStrategy,
} from './split-strategy.interface';

const PERCENTAGE_TOLERANCE = new Prisma.Decimal('0.01');

export class PercentageSplitStrategy implements SplitStrategy {
  readonly type = SplitType.PERCENTAGE;

  compute(
    totalAmount: Prisma.Decimal,
    participants: SplitParticipantInput[],
  ): ComputedParticipantShare[] {
    assertValidParticipantList(participants);

    for (const p of participants) {
      if (p.value === undefined || p.value <= 0) {
        throw new BadRequestException(
          `A positive percentage value is required for participant ${p.userId} in a PERCENTAGE split`,
        );
      }
    }

    const values = participants.map((p) => new Prisma.Decimal(p.value!));
    const sum = values.reduce((acc, v) => acc.plus(v), new Prisma.Decimal(0));
    if (sum.minus(100).abs().greaterThan(PERCENTAGE_TOLERANCE)) {
      throw new BadRequestException(
        `Percentages must sum to 100 (got ${sum.toString()})`,
      );
    }

    const shares = distributeWithLargestRemainder(
      totalAmount,
      participants.map((p, i) => ({
        userId: p.userId,
        idealShare: totalAmount.times(values[i]).dividedBy(100),
      })),
    );

    return participants.map((p, i) => ({
      userId: p.userId,
      shareAmount: shares.get(p.userId)!,
      inputValue: values[i],
    }));
  }
}
