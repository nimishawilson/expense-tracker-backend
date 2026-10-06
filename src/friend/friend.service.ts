import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FriendQueryDto } from './dto/friend-query.dto';

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number, query: FriendQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.FriendshipWhereInput = {
      userId,
      ...(search
        ? {
            friend: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.friendship.findMany({
        where,
        include: { friend: { select: { id: true, name: true, email: true } } },
        orderBy: { friend: { name: 'asc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.friendship.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({ ...r.friend, since: r.createdAt })),
      total,
      page,
      limit,
    };
  }

  async remove(userId: number, friendId: number) {
    const { count } = await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });
    if (count === 0) {
      throw new NotFoundException('Friend not found');
    }
    return { message: 'Friend removed successfully' };
  }

  async areFriends(userId: number, otherId: number) {
    const found = await this.prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId: otherId } },
      select: { id: true },
    });
    return found !== null;
  }

  /** Creates both directions of a friendship; safe to call repeatedly. */
  createFriendship(
    tx: Prisma.TransactionClient,
    userId: number,
    friendId: number,
  ) {
    return tx.friendship.createMany({
      data: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
      skipDuplicates: true,
    });
  }

  /**
   * Every id must be the acting user or one of their friends. The message is
   * deliberately the same for "no such user" and "not a friend".
   */
  async assertCanUse(userId: number, ids: number[]) {
    const others = [...new Set(ids)].filter((id) => id !== userId);
    if (others.length === 0) {
      return;
    }
    const friends = await this.prisma.friendship.findMany({
      where: { userId, friendId: { in: others } },
      select: { friendId: true },
    });
    const friendIds = new Set(friends.map((f) => f.friendId));
    const missing = others.filter((id) => !friendIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `User(s) not found or not in your friends list: ${missing.join(', ')}`,
      );
    }
  }
}
