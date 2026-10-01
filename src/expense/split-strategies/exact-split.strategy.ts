import { BadRequestException } from '@nestjs/common';
import { Prisma, SplitType } from '../../../generated/prisma/client';
import { assertValidParticipantList } from './split-validation.util';
import {
  ComputedParticipantShare,
  SplitParticipantInput,
  SplitStrategy,
} from './split-strategy.interface';

export class ExactSplitStrategy implements SplitStrategy {
  readonly type = SplitType.EXACT;

  compute(
    totalAmount: Prisma.Decimal,
    participants: SplitParticipantInput[],
  ): ComputedParticipantShare[] {
    assertValidParticipantList(participants);

    for (const p of participants) {
      if (p.value === undefined || p.value <= 0) {
        throw new BadRequestException(
          `A positive exact amount is required for participant ${p.userId} in an EXACT split`,
        );
      }
    }

    const values = participants.map((p) => new Prisma.Decimal(p.value!));
    const totalCents = totalAmount
      .times(100)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
    const sumCents = values
      .reduce((acc, v) => acc.plus(v), new Prisma.Decimal(0))
      .times(100)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

    if (!sumCents.equals(totalCents)) {
      throw new BadRequestException(
        `Exact amounts must sum to the total (expected ${totalAmount.toString()}, got ${values
          .reduce((acc, v) => acc.plus(v), new Prisma.Decimal(0))
          .toString()})`,
      );
    }

    return participants.map((p, i) => ({
      userId: p.userId,
      shareAmount: values[i],
      inputValue: values[i],
    }));
  }
}
