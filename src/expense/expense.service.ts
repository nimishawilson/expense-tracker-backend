import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { createSplitStrategy } from './split-strategies/split-strategy.factory';
import {
  ComputedParticipantShare,
  SplitParticipantInput,
} from './split-strategies/split-strategy.interface';

const EXPENSE_INCLUDE = { category: true, participants: true } as const;

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCategoryVisible(categoryId: number, userId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || (!category.isDefault && category.userId !== userId)) {
      throw new NotFoundException('Category not found');
    }
  }

  private async assertUserExists(userId: number, label: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`${label} not found`);
    }
  }

  private async assertParticipantUsersExist(userIds: number[]) {
    const found = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((u) => u.id));
    const missing = userIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Participant user(s) not found: ${missing.join(', ')}`,
      );
    }
  }

  private async findVisibleOrThrow(id: number, userId: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: EXPENSE_INCLUDE,
    });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    const visible =
      expense.ownerId === userId ||
      expense.participants.some((p) => p.userId === userId);
    if (!visible) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async create(ownerId: number, dto: CreateExpenseDto) {
    const paidById = dto.paidById ?? ownerId;

    await this.assertCategoryVisible(dto.categoryId, ownerId);
    if (paidById !== ownerId) {
      await this.assertUserExists(paidById, 'Paid-by user');
    }

    let computed: ComputedParticipantShare[] | undefined;
    if (dto.splitType) {
      const participants = dto.participants!;
      await this.assertParticipantUsersExist(participants.map((p) => p.userId));
      const strategy = createSplitStrategy(dto.splitType);
      computed = strategy.compute(new Prisma.Decimal(dto.amount), participants);
    }

    const expense = await this.prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          amount: dto.amount,
          description: dto.description,
          date: new Date(dto.date),
          categoryId: dto.categoryId,
          ownerId,
          paidById,
          splitType: dto.splitType ?? null,
        },
      });

      if (computed) {
        await tx.expenseParticipant.createMany({
          data: computed.map((c) => ({
            expenseId: created.id,
            userId: c.userId,
            shareAmount: c.shareAmount,
            inputValue: c.inputValue,
          })),
        });
      }

      return created;
    });

    return this.findVisibleOrThrow(expense.id, ownerId);
  }

  async findAll(userId: number, query: ExpenseQueryDto) {
    const where: Prisma.ExpenseWhereInput = {
      AND: [
        { OR: [{ ownerId: userId }, { participants: { some: { userId } } }] },
        query.categoryId ? { categoryId: query.categoryId } : {},
        query.participantId
          ? { participants: { some: { userId: query.participantId } } }
          : {},
        query.fromDate || query.toDate
          ? {
              date: {
                gte: query.fromDate ? new Date(query.fromDate) : undefined,
                lte: query.toDate ? new Date(query.toDate) : undefined,
              },
            }
          : {},
      ],
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: EXPENSE_INCLUDE,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number, userId: number) {
    return this.findVisibleOrThrow(id, userId);
  }

  async update(id: number, userId: number, dto: UpdateExpenseDto) {
    const expense = await this.findVisibleOrThrow(id, userId);
    if (expense.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the expense owner can edit this expense',
      );
    }

    if (dto.categoryId !== undefined) {
      await this.assertCategoryVisible(dto.categoryId, userId);
    }

    const paidById = dto.paidById ?? expense.paidById;
    if (dto.paidById !== undefined && dto.paidById !== expense.paidById) {
      await this.assertUserExists(paidById, 'Paid-by user');
    }

    const recalcNeeded =
      dto.amount !== undefined ||
      dto.splitType !== undefined ||
      dto.participants !== undefined;
    const effectiveSplitType =
      dto.splitType !== undefined ? dto.splitType : expense.splitType;

    let computed: ComputedParticipantShare[] | undefined;
    if (recalcNeeded && effectiveSplitType) {
      const effectiveParticipants: SplitParticipantInput[] =
        dto.participants ??
        expense.participants.map((p) => ({
          userId: p.userId,
          value: p.inputValue !== null ? Number(p.inputValue) : undefined,
        }));

      await this.assertParticipantUsersExist(
        effectiveParticipants.map((p) => p.userId),
      );
      const strategy = createSplitStrategy(effectiveSplitType);
      computed = strategy.compute(
        new Prisma.Decimal(dto.amount ?? expense.amount),
        effectiveParticipants,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: {
          amount: dto.amount,
          description: dto.description,
          date: dto.date ? new Date(dto.date) : undefined,
          categoryId: dto.categoryId,
          paidById: dto.paidById,
          splitType: dto.splitType,
        },
      });

      if (computed) {
        await tx.expenseParticipant.deleteMany({ where: { expenseId: id } });
        await tx.expenseParticipant.createMany({
          data: computed.map((c) => ({
            expenseId: id,
            userId: c.userId,
            shareAmount: c.shareAmount,
            inputValue: c.inputValue,
          })),
        });
      }
    });

    return this.findVisibleOrThrow(id, userId);
  }

  async remove(id: number, userId: number) {
    const expense = await this.findVisibleOrThrow(id, userId);
    if (expense.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the expense owner can delete this expense',
      );
    }

    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Expense deleted successfully' };
  }
}
