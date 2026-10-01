import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { ExactSplitStrategy } from './exact-split.strategy';

describe('ExactSplitStrategy', () => {
  const strategy = new ExactSplitStrategy();

  it('accepts exact amounts that sum to the total', () => {
    const result = strategy.compute(new Prisma.Decimal('100.00'), [
      { userId: 1, value: 60 },
      { userId: 2, value: 40 },
    ]);
    expect(result).toEqual(
      expect.arrayContaining([
        {
          userId: 1,
          shareAmount: new Prisma.Decimal(60),
          inputValue: new Prisma.Decimal(60),
        },
        {
          userId: 2,
          shareAmount: new Prisma.Decimal(40),
          inputValue: new Prisma.Decimal(40),
        },
      ]),
    );
  });

  it('rejects amounts that are off by a single cent', () => {
    expect(() =>
      strategy.compute(new Prisma.Decimal('100.00'), [
        { userId: 1, value: 60.01 },
        { userId: 2, value: 40 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects a missing or non-positive value', () => {
    expect(() =>
      strategy.compute(new Prisma.Decimal('100.00'), [
        { userId: 1, value: 100 },
        { userId: 2, value: -5 },
      ]),
    ).toThrow(BadRequestException);
  });
});
