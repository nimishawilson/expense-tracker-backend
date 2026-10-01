import { Prisma } from '../../../generated/prisma/client';

interface IdealShare {
  userId: number;
  idealShare: Prisma.Decimal;
}

/**
 * Largest-remainder rounding: converts un-rounded ideal shares (which sum to
 * ~totalAmount) into 2dp shares whose sum is EXACTLY totalAmount. Whole cents
 * are floored per participant, then the leftover cents are handed out one at a
 * time to the participants with the largest fractional remainder, tie-broken
 * by ascending userId for determinism.
 */
export function distributeWithLargestRemainder(
  totalAmount: Prisma.Decimal,
  ideal: IdealShare[],
): Map<number, Prisma.Decimal> {
  const totalCents = totalAmount
    .times(100)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

  const entries = ideal.map((i) => {
    const exactCents = i.idealShare.times(100);
    const flooredCents = exactCents.toDecimalPlaces(
      0,
      Prisma.Decimal.ROUND_DOWN,
    );
    return {
      userId: i.userId,
      cents: flooredCents,
      remainder: exactCents.minus(flooredCents),
    };
  });

  const distributedCents = entries.reduce(
    (sum, e) => sum.plus(e.cents),
    new Prisma.Decimal(0),
  );
  const leftoverCents = totalCents.minus(distributedCents).toNumber();

  if (leftoverCents > 0) {
    // Shortfall: hand out cents to whoever lost the most to flooring.
    const order = [...entries].sort((a, b) => {
      const cmp = b.remainder.comparedTo(a.remainder);
      return cmp !== 0 ? cmp : a.userId - b.userId;
    });
    for (let i = 0; i < leftoverCents; i++) {
      order[i].cents = order[i].cents.plus(1);
    }
  } else if (leftoverCents < 0) {
    // Surplus: the ideal shares themselves summed to more than totalAmount
    // (e.g. PERCENTAGE splits allow percentages to sum to 100 +/- 0.01), so
    // claw cents back from whoever lost the least to flooring.
    const order = [...entries].sort((a, b) => {
      const cmp = a.remainder.comparedTo(b.remainder);
      return cmp !== 0 ? cmp : a.userId - b.userId;
    });
    for (let i = 0; i < -leftoverCents; i++) {
      order[i].cents = order[i].cents.minus(1);
    }
  }

  const result = new Map<number, Prisma.Decimal>();
  for (const e of entries) {
    result.set(e.userId, e.cents.dividedBy(100));
  }
  return result;
}
