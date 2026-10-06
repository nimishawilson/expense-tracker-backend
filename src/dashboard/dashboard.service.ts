import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { getMonthRange } from './month-range.util';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: number, query: DashboardSummaryQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timeZone: true, defaultCurrency: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { month, timeZone, start, end } = getMonthRange(
      user.timeZone,
      query.month,
    );
    const dateRange = { gte: start, lt: end };

    const [personal, shares] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { ownerId: userId, splitType: null, date: dateRange },
        _sum: { amount: true },
      }),
      this.prisma.expenseParticipant.aggregate({
        where: { userId, expense: { date: dateRange } },
        _sum: { shareAmount: true },
      }),
    ]);

    const totalSpent = new Prisma.Decimal(personal._sum.amount ?? 0).plus(
      shares._sum.shareAmount ?? 0,
    );

    return {
      month,
      timeZone,
      from: start.toISOString(),
      to: end.toISOString(),
      currency: user.defaultCurrency,
      totalSpent: totalSpent.toFixed(2),
    };
  }
}
