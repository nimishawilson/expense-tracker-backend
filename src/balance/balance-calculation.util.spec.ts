import { Prisma } from '../../generated/prisma/client';
import { computeNetBalances } from './balance-calculation.util';

const CURRENT_USER_ID = 1;
const COUNTERPART_ID = 2;
const OTHER_COUNTERPART_ID = 3;

describe('computeNetBalances', () => {
  it('nets a share where the current user paid as positive (counterpart owes them)', () => {
    const result = computeNetBalances(
      CURRENT_USER_ID,
      [
        {
          userId: COUNTERPART_ID,
          shareAmount: new Prisma.Decimal('10.00'),
          paidById: CURRENT_USER_ID,
        },
      ],
      [],
    );
    expect(result.get(COUNTERPART_ID)!.toString()).toBe('10');
  });

  it('nets a share where the counterpart paid as negative (current user owes them)', () => {
    const result = computeNetBalances(
      CURRENT_USER_ID,
      [
        {
          userId: CURRENT_USER_ID,
          shareAmount: new Prisma.Decimal('10.00'),
          paidById: COUNTERPART_ID,
        },
      ],
      [],
    );
    expect(result.get(COUNTERPART_ID)!.toString()).toBe('-10');
  });

  it('nets multiple expenses between the same pair in both directions', () => {
    const result = computeNetBalances(
      CURRENT_USER_ID,
      [
        {
          userId: COUNTERPART_ID,
          shareAmount: new Prisma.Decimal('10.00'),
          paidById: CURRENT_USER_ID,
        },
        {
          userId: COUNTERPART_ID,
          shareAmount: new Prisma.Decimal('15.00'),
          paidById: CURRENT_USER_ID,
        },
        {
          userId: CURRENT_USER_ID,
          shareAmount: new Prisma.Decimal('8.00'),
          paidById: COUNTERPART_ID,
        },
      ],
      [],
    );
    expect(result.get(COUNTERPART_ID)!.toString()).toBe('17');
  });

  it('reduces a positive net when the counterpart settles up with the current user', () => {
    const result = computeNetBalances(
      CURRENT_USER_ID,
      [
        {
          userId: COUNTERPART_ID,
          shareAmount: new Prisma.Decimal('20.00'),
          paidById: CURRENT_USER_ID,
        },
      ],
      [
        {
          fromUserId: COUNTERPART_ID,
          toUserId: CURRENT_USER_ID,
          amount: new Prisma.Decimal('20.00'),
        },
      ],
    );
    expect(result.get(COUNTERPART_ID)!.toString()).toBe('0');
  });

  it('reduces a negative net when the current user settles up with the counterpart', () => {
    const result = computeNetBalances(
      CURRENT_USER_ID,
      [
        {
          userId: CURRENT_USER_ID,
          shareAmount: new Prisma.Decimal('20.00'),
          paidById: COUNTERPART_ID,
        },
      ],
      [
        {
          fromUserId: CURRENT_USER_ID,
          toUserId: COUNTERPART_ID,
          amount: new Prisma.Decimal('20.00'),
        },
      ],
    );
    expect(result.get(COUNTERPART_ID)!.toString()).toBe('0');
  });

  it('tracks multiple counterparties independently', () => {
    const result = computeNetBalances(
      CURRENT_USER_ID,
      [
        {
          userId: COUNTERPART_ID,
          shareAmount: new Prisma.Decimal('10.00'),
          paidById: CURRENT_USER_ID,
        },
        {
          userId: CURRENT_USER_ID,
          shareAmount: new Prisma.Decimal('5.00'),
          paidById: OTHER_COUNTERPART_ID,
        },
      ],
      [],
    );
    expect(result.get(COUNTERPART_ID)!.toString()).toBe('10');
    expect(result.get(OTHER_COUNTERPART_ID)!.toString()).toBe('-5');
  });
});
