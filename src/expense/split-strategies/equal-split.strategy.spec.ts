import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { EqualSplitStrategy } from './equal-split.strategy';

describe('EqualSplitStrategy', () => {
  const strategy = new EqualSplitStrategy();

  it('splits evenly when the amount divides exactly', () => {
    const result = strategy.compute(new Prisma.Decimal('10.00'), [
      { userId: 1 },
      { userId: 2 },
    ]);
    expect(result).toEqual(
      expect.arrayContaining([
        {
          userId: 1,
          shareAmount: new Prisma.Decimal('5.00'),
          inputValue: null,
        },
        {
          userId: 2,
          shareAmount: new Prisma.Decimal('5.00'),
          inputValue: null,
        },
      ]),
    );
  });

  it('distributes remainder cents deterministically when the amount does not divide exactly', () => {
    const result = strategy.compute(new Prisma.Decimal('10.00'), [
      { userId: 1 },
      { userId: 2 },
      { userId: 3 },
    ]);
    const sum = result.reduce(
      (acc, r) => acc.plus(r.shareAmount),
      new Prisma.Decimal(0),
    );
    expect(sum.equals(new Prisma.Decimal('10.00'))).toBe(true);
    const shares = result.map((r) => r.shareAmount.toString()).sort();
    expect(shares).toEqual(['3.33', '3.33', '3.34']);
  });

  it('rejects a value provided on any participant', () => {
    expect(() =>
      strategy.compute(new Prisma.Decimal('10.00'), [
        { userId: 1, value: 5 },
        { userId: 2 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects an empty participant list', () => {
    expect(() => strategy.compute(new Prisma.Decimal('10.00'), [])).toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicate participant ids', () => {
    expect(() =>
      strategy.compute(new Prisma.Decimal('10.00'), [
        { userId: 1 },
        { userId: 1 },
      ]),
    ).toThrow(BadRequestException);
  });
});
