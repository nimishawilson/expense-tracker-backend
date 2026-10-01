import { Prisma } from '../../generated/prisma/client';

export interface ShareRow {
  userId: number;
  shareAmount: Prisma.Decimal;
  paidById: number;
}

export interface SettlementRow {
  fromUserId: number;
  toUserId: number;
  amount: Prisma.Decimal;
}

/**
 * Nets expense shares and settlements into a per-counterpart balance from
 * currentUserId's perspective. Positive = counterpart owes currentUserId;
 * negative = currentUserId owes counterpart.
 */
export function computeNetBalances(
  currentUserId: number,
  shareRows: ShareRow[],
  settlementRows: SettlementRow[],
): Map<number, Prisma.Decimal> {
  const net = new Map<number, Prisma.Decimal>();
  const add = (counterpartId: number, delta: Prisma.Decimal) =>
    net.set(
      counterpartId,
      (net.get(counterpartId) ?? new Prisma.Decimal(0)).plus(delta),
    );

  for (const row of shareRows) {
    if (row.paidById === currentUserId) {
      add(row.userId, row.shareAmount);
    } else {
      add(row.paidById, row.shareAmount.negated());
    }
  }

  for (const row of settlementRows) {
    if (row.fromUserId === currentUserId) {
      add(row.toUserId, row.amount);
    } else {
      add(row.fromUserId, row.amount.negated());
    }
  }

  return net;
}
