import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeNetBalances } from './balance-calculation.util';

@Injectable()
export class BalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalances(userId: number) {
    const [shares, settlements] = await Promise.all([
      this.prisma.expenseParticipant.findMany({
        where: {
          OR: [
            { expense: { paidById: userId }, userId: { not: userId } },
            { userId, expense: { paidById: { not: userId } } },
          ],
        },
        select: {
          userId: true,
          shareAmount: true,
          expense: { select: { paidById: true } },
        },
      }),
      this.prisma.settlement.findMany({
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
        select: { fromUserId: true, toUserId: true, amount: true },
      }),
    ]);

    const net = computeNetBalances(
      userId,
      shares.map((s) => ({
        userId: s.userId,
        shareAmount: s.shareAmount,
        paidById: s.expense.paidById,
      })),
      settlements,
    );

    const counterpartIds = [...net.entries()]
      .filter(([, amount]) => !amount.isZero())
      .map(([counterpartId]) => counterpartId);

    const users = await this.prisma.user.findMany({
      where: { id: { in: counterpartIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    let totalYouOwe = new Prisma.Decimal(0);
    let totalYouAreOwed = new Prisma.Decimal(0);

    const breakdown = counterpartIds.map((counterpartId) => {
      const amount = net.get(counterpartId)!;
      const youAreOwed = amount.isPositive() ? amount : new Prisma.Decimal(0);
      const youOwe = amount.isNegative() ? amount.abs() : new Prisma.Decimal(0);

      totalYouAreOwed = totalYouAreOwed.plus(youAreOwed);
      totalYouOwe = totalYouOwe.plus(youOwe);

      return {
        counterpartUserId: counterpartId,
        counterpartName: nameById.get(counterpartId) ?? 'Unknown user',
        youOwe: youOwe.toFixed(2),
        youAreOwed: youAreOwed.toFixed(2),
        net: amount.toFixed(2),
      };
    });

    return {
      totalYouOwe: totalYouOwe.toFixed(2),
      totalYouAreOwed: totalYouAreOwed.toFixed(2),
      netBalance: totalYouAreOwed.minus(totalYouOwe).toFixed(2),
      breakdown,
    };
  }
}
