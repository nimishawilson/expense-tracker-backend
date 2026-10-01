import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementQueryDto } from './dto/settlement-query.dto';

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertUserExists(userId: number, label: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`${label} not found`);
    }
  }

  async create(currentUserId: number, dto: CreateSettlementDto) {
    if (dto.fromUserId === dto.toUserId) {
      throw new BadRequestException('fromUserId and toUserId must differ');
    }
    if (currentUserId !== dto.fromUserId && currentUserId !== dto.toUserId) {
      throw new ForbiddenException('You must be a party to this settlement');
    }

    await this.assertUserExists(dto.fromUserId, 'From user');
    await this.assertUserExists(dto.toUserId, 'To user');

    return this.prisma.settlement.create({
      data: {
        fromUserId: dto.fromUserId,
        toUserId: dto.toUserId,
        amount: dto.amount,
        note: dto.note ?? null,
      },
    });
  }

  async findAll(userId: number, query: SettlementQueryDto) {
    const where: Prisma.SettlementWhereInput = {
      AND: [
        { OR: [{ fromUserId: userId }, { toUserId: userId }] },
        query.counterpartUserId
          ? {
              OR: [
                { fromUserId: query.counterpartUserId },
                { toUserId: query.counterpartUserId },
              ],
            }
          : {},
        query.fromDate || query.toDate
          ? {
              createdAt: {
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
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
