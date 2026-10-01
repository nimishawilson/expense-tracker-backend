import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PercentageSplitStrategy } from './percentage-split.strategy';

describe('PercentageSplitStrategy', () => {
  const strategy = new PercentageSplitStrategy();

  it('splits by percentage and sums exactly to the total', () => {
    const result = strategy.compute(new Prisma.Decimal('100.00'), [
      { userId: 1, value: 33.33 },
      { userId: 2, value: 33.33 },
      { userId: 3, value: 33.34 },
    ]);
    const sum = result.reduce(
      (acc, r) => acc.plus(r.shareAmount),
      new Prisma.Decimal(0),
    );
    expect(sum.equals(new Prisma.Decimal('100.00'))).toBe(true);
  });

  it('accepts percentages summing to 100 within the 0.01 tolerance', () => {
    expect(() =>
      strategy.compute(new Prisma.Decimal('100.00'), [
        { userId: 1, value: 50.005 },
        { userId: 2, value: 49.995 },
      ]),
    ).not.toThrow();
  });

  it('sums to the total exactly when percentages within tolerance overshoot 100', () => {
    // 33.34 + 33.33 + 33.34 = 100.01, accepted by the tolerance. On a $100
    // total these ideal shares land on whole cents, leaving no fractional
    // remainder for the rounding step to absorb the extra cent from.
    const result = strategy.compute(new Prisma.Decimal('100.00'), [
      { userId: 1, value: 33.34 },
      { userId: 2, value: 33.33 },
      { userId: 3, value: 33.34 },
    ]);
    const sum = result.reduce(
      (acc, r) => acc.plus(r.shareAmount),
      new Prisma.Decimal(0),
    );
    expect(sum.equals(new Prisma.Decimal('100.00'))).toBe(true);
  });

  it('rejects percentages that do not sum to 100', () => {
    expect(() =>
      strategy.compute(new Prisma.Decimal('100.00'), [
        { userId: 1, value: 40 },
        { userId: 2, value: 40 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects a missing or non-positive value', () => {
    expect(() =>
      strategy.compute(new Prisma.Decimal('100.00'), [
        { userId: 1 },
        { userId: 2, value: 100 },
      ]),
    ).toThrow(BadRequestException);
  });
});
