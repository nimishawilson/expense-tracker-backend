import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { SharesSplitStrategy } from './shares-split.strategy';

describe('SharesSplitStrategy', () => {
  const strategy = new SharesSplitStrategy();

  it('splits proportionally by share weight and sums exactly to the total', () => {
    const result = strategy.compute(new Prisma.Decimal('100.00'), [
      { userId: 1, value: 1 },
      { userId: 2, value: 1 },
      { userId: 3, value: 2 },
    ]);
    const sum = result.reduce(
      (acc, r) => acc.plus(r.shareAmount),
      new Prisma.Decimal(0),
    );
    expect(sum.equals(new Prisma.Decimal('100.00'))).toBe(true);
    const byUser = new Map(
      result.map((r) => [r.userId, r.shareAmount.toString()]),
    );
    expect(byUser.get(1)).toBe('25');
    expect(byUser.get(2)).toBe('25');
    expect(byUser.get(3)).toBe('50');
  });

  it('rejects a missing or non-positive share weight', () => {
    expect(() =>
      strategy.compute(new Prisma.Decimal('100.00'), [
        { userId: 1, value: 1 },
        { userId: 2, value: 0 },
      ]),
    ).toThrow(BadRequestException);
  });
});
