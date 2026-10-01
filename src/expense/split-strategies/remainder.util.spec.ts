import { Prisma } from '../../../generated/prisma/client';
import { distributeWithLargestRemainder } from './remainder.util';

describe('distributeWithLargestRemainder', () => {
  it('sums to the total exactly, even when the ideal shares do not', () => {
    const totalAmount = new Prisma.Decimal('10.00');
    const idealShare = totalAmount.dividedBy(3);
    const result = distributeWithLargestRemainder(totalAmount, [
      { userId: 1, idealShare },
      { userId: 2, idealShare },
      { userId: 3, idealShare },
    ]);
    const sum = [...result.values()].reduce(
      (acc, v) => acc.plus(v),
      new Prisma.Decimal(0),
    );
    expect(sum.equals(totalAmount)).toBe(true);
  });

  it('gives the leftover cent to the lowest userId on a remainder tie', () => {
    const totalAmount = new Prisma.Decimal('10.00');
    const idealShare = totalAmount.dividedBy(3);
    const result = distributeWithLargestRemainder(totalAmount, [
      { userId: 3, idealShare },
      { userId: 1, idealShare },
      { userId: 2, idealShare },
    ]);
    expect(result.get(1)!.toString()).toBe('3.34');
    expect(result.get(2)!.toString()).toBe('3.33');
    expect(result.get(3)!.toString()).toBe('3.33');
  });

  it('leaves an already-exact distribution unchanged', () => {
    const totalAmount = new Prisma.Decimal('10.00');
    const result = distributeWithLargestRemainder(totalAmount, [
      { userId: 1, idealShare: new Prisma.Decimal('5.00') },
      { userId: 2, idealShare: new Prisma.Decimal('5.00') },
    ]);
    expect(result.get(1)!.toString()).toBe('5');
    expect(result.get(2)!.toString()).toBe('5');
  });

  it('sums to the total exactly when the ideal shares already exceed it', () => {
    const totalAmount = new Prisma.Decimal('100.00');
    const result = distributeWithLargestRemainder(totalAmount, [
      { userId: 1, idealShare: new Prisma.Decimal('33.34') },
      { userId: 2, idealShare: new Prisma.Decimal('33.33') },
      { userId: 3, idealShare: new Prisma.Decimal('33.34') },
    ]);
    const sum = [...result.values()].reduce(
      (acc, v) => acc.plus(v),
      new Prisma.Decimal(0),
    );
    expect(sum.equals(totalAmount)).toBe(true);
  });

  it('claws back the surplus cent from the lowest userId on a remainder tie', () => {
    const totalAmount = new Prisma.Decimal('100.00');
    const result = distributeWithLargestRemainder(totalAmount, [
      { userId: 3, idealShare: new Prisma.Decimal('33.34') },
      { userId: 1, idealShare: new Prisma.Decimal('33.34') },
      { userId: 2, idealShare: new Prisma.Decimal('33.33') },
    ]);
    expect(result.get(1)!.toString()).toBe('33.33');
    expect(result.get(2)!.toString()).toBe('33.33');
    expect(result.get(3)!.toString()).toBe('33.34');
  });

  it('claws back the surplus cent from the smallest remainder, not the smallest share', () => {
    const totalAmount = new Prisma.Decimal('100.00');
    const result = distributeWithLargestRemainder(totalAmount, [
      { userId: 1, idealShare: new Prisma.Decimal('40.015') },
      { userId: 2, idealShare: new Prisma.Decimal('30.010') },
      { userId: 3, idealShare: new Prisma.Decimal('30.008') },
    ]);
    const sum = [...result.values()].reduce(
      (acc, v) => acc.plus(v),
      new Prisma.Decimal(0),
    );
    expect(sum.equals(totalAmount)).toBe(true);
    // user 3 has the largest remaining fractional remainder (0.8 of a cent)
    // after flooring, so it should be the one left untouched.
    expect(result.get(3)!.toString()).toBe('30');
  });
});
