import {
  ConflictException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FriendRequest, Prisma } from '../../generated/prisma/client';
import { FriendRequestStatus } from '../../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  FriendRequestDirection,
  FriendRequestQueryDto,
} from './dto/friend-request-query.dto';
import { FriendService } from './friend.service';
import {
  expiryFrom,
  generateToken,
  hashToken,
  isExpired,
  MAX_SENDS,
  normalizeEmail,
  REJECT_COOLDOWN_MS,
  RESEND_COOLDOWN_MS,
} from './friend-token.util';

type RequestUser = { id: number; email: string };
type Action = 'accept' | 'reject';

const SENDER_SELECT = { id: true, name: true, email: true } as const;

@Injectable()
export class FriendRequestService {
  private readonly ttlDays: number;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.ttlDays = Number(config.get('FRIEND_REQUEST_TTL_DAYS') ?? 7);
    this.frontendUrl = (
      config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'
    ).replace(/\/$/, '');
  }

  private toResponse(
    r: FriendRequest & { sender?: { id: number; name: string; email: string } },
  ) {
    return {
      id: r.id,
      receiverEmail: r.receiverEmail,
      status: r.status,
      expired: r.status === 'PENDING' && isExpired(r.expiresAt),
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      lastSentAt: r.lastSentAt,
      ...(r.sender ? { sender: r.sender } : {}),
    };
  }

  private deliver(
    to: string,
    senderName: string,
    token: string,
    recipientRegistered: boolean,
  ) {
    // Not awaited: a slow or failing mail server must not delay or fail the
    // request. MailService logs failures; the sender can resend.
    void this.mail.sendFriendRequest({
      to,
      senderName,
      link: `${this.frontendUrl}/friends/respond?token=${token}`,
      recipientRegistered,
    });
  }

  async send(sender: RequestUser, email: string) {
    const receiverEmail = normalizeEmail(email);
    const senderEmail = normalizeEmail(sender.email);
    if (receiverEmail === senderEmail) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    const [receiver, senderUser] = await Promise.all([
      this.prisma.user.findFirst({
        where: { email: { equals: receiverEmail, mode: 'insensitive' } },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { id: sender.id },
        select: { name: true },
      }),
    ]);
    if (!senderUser) {
      throw new NotFoundException('User not found');
    }

    if (receiver && (await this.friends.areFriends(sender.id, receiver.id))) {
      throw new ConflictException('You are already friends');
    }

    // They already asked me: accepting theirs is the natural outcome.
    if (receiver) {
      const reverse = await this.prisma.friendRequest.findUnique({
        where: {
          senderId_receiverEmail: {
            senderId: receiver.id,
            receiverEmail: senderEmail,
          },
        },
      });
      if (
        reverse &&
        reverse.status === 'PENDING' &&
        !isExpired(reverse.expiresAt)
      ) {
        return this.toResponse(await this.accept(reverse, sender.id));
      }
    }

    const now = new Date();
    const { token, tokenHash } = generateToken();
    const fresh = {
      tokenHash,
      status: FriendRequestStatus.PENDING,
      expiresAt: expiryFrom(now, this.ttlDays),
      lastSentAt: now,
      sendCount: 1,
      respondedAt: null,
    };

    const existing = await this.prisma.friendRequest.findUnique({
      where: {
        senderId_receiverEmail: { senderId: sender.id, receiverEmail },
      },
    });

    if (existing) {
      if (existing.status === 'PENDING' && !isExpired(existing.expiresAt)) {
        return this.toResponse(existing); // idempotent; use resend for a new email
      }
      if (
        existing.status === 'REJECTED' &&
        existing.respondedAt &&
        now.getTime() - existing.respondedAt.getTime() < REJECT_COOLDOWN_MS
      ) {
        throw new ConflictException(
          'This request was declined recently; you can try again later',
        );
      }
    }

    const saved = existing
      ? await this.prisma.friendRequest.update({
          where: { id: existing.id },
          data: fresh,
        })
      : await this.prisma.friendRequest.create({
          data: { senderId: sender.id, receiverEmail, ...fresh },
        });

    this.deliver(receiverEmail, senderUser.name, token, !!receiver);
    return this.toResponse(saved);
  }

  async list(user: RequestUser, query: FriendRequestQueryDto) {
    const incoming =
      (query.direction ?? FriendRequestDirection.INCOMING) ===
      FriendRequestDirection.INCOMING;
    const status = query.status ?? (incoming ? 'PENDING' : undefined);

    const where: Prisma.FriendRequestWhereInput = {
      ...(incoming
        ? { receiverEmail: normalizeEmail(user.email) }
        : { senderId: user.id }),
      ...(status ? { status } : {}),
      // Hide dead invitations from the in-app inbox.
      ...(incoming && status === 'PENDING'
        ? { expiresAt: { gt: new Date() } }
        : {}),
    };
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.friendRequest.findMany({
        where,
        include: incoming ? { sender: { select: SENDER_SELECT } } : undefined,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.friendRequest.count({ where }),
    ]);

    return { data: rows.map((r) => this.toResponse(r)), total, page, limit };
  }

  private async findIncomingOrThrow(user: RequestUser, id: number) {
    const request = await this.prisma.friendRequest.findFirst({
      where: { id, receiverEmail: normalizeEmail(user.email) },
    });
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }
    return request;
  }

  private assertRespondable(request: FriendRequest) {
    if (request.status !== 'PENDING') {
      throw new ConflictException(
        `Friend request already ${request.status.toLowerCase()}`,
      );
    }
    if (isExpired(request.expiresAt)) {
      throw new GoneException('Friend request has expired');
    }
  }

  private async accept(request: FriendRequest, receiverId: number) {
    this.assertRespondable(request);
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.friendRequest.updateMany({
        where: { id: request.id, status: 'PENDING' },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });
      if (count === 0) {
        throw new ConflictException('Friend request is no longer pending');
      }
      await this.friends.createFriendship(tx, request.senderId, receiverId);
      return tx.friendRequest.findUniqueOrThrow({ where: { id: request.id } });
    });
  }

  private async reject(request: FriendRequest) {
    this.assertRespondable(request);
    const { count } = await this.prisma.friendRequest.updateMany({
      where: { id: request.id, status: 'PENDING' },
      data: { status: 'REJECTED', respondedAt: new Date() },
    });
    if (count === 0) {
      throw new ConflictException('Friend request is no longer pending');
    }
    return this.prisma.friendRequest.findUniqueOrThrow({
      where: { id: request.id },
    });
  }

  async respond(user: RequestUser, id: number, action: Action) {
    const request = await this.findIncomingOrThrow(user, id);
    const updated =
      action === 'accept'
        ? await this.accept(request, user.id)
        : await this.reject(request);
    return this.toResponse(updated);
  }

  async cancel(user: RequestUser, id: number) {
    const request = await this.prisma.friendRequest.findFirst({
      where: { id, senderId: user.id },
    });
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }
    const { count } = await this.prisma.friendRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'CANCELLED', respondedAt: new Date() },
    });
    if (count === 0) {
      throw new ConflictException(
        `Friend request already ${request.status.toLowerCase()}`,
      );
    }
    return { message: 'Friend request cancelled' };
  }

  async resend(user: RequestUser, id: number) {
    const request = await this.prisma.friendRequest.findFirst({
      where: { id, senderId: user.id },
      include: { sender: { select: { name: true } } },
    });
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }
    if (request.status !== 'PENDING') {
      throw new ConflictException(
        `Friend request already ${request.status.toLowerCase()}`,
      );
    }
    const now = new Date();
    if (now.getTime() - request.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new HttpException(
        'Please wait before resending this request',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (request.sendCount >= MAX_SENDS) {
      throw new HttpException(
        'This request has been sent the maximum number of times',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const { token, tokenHash } = generateToken();
    const saved = await this.prisma.friendRequest.update({
      where: { id },
      data: {
        tokenHash,
        expiresAt: expiryFrom(now, this.ttlDays),
        lastSentAt: now,
        sendCount: { increment: 1 },
      },
    });
    const receiver = await this.prisma.user.findFirst({
      where: { email: { equals: request.receiverEmail, mode: 'insensitive' } },
      select: { id: true },
    });
    this.deliver(request.receiverEmail, request.sender.name, token, !!receiver);
    return this.toResponse(saved);
  }

  // --- Token (email link) flow: public endpoints, the token is the credential ---

  private async findByTokenOrThrow(token: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { sender: { select: { name: true } } },
    });
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }
    return request;
  }

  private findReceiver(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
  }

  async tokenDetails(token: string) {
    const request = await this.findByTokenOrThrow(token);
    return {
      senderName: request.sender.name,
      receiverEmail: request.receiverEmail,
      status: request.status,
      expired: request.status === 'PENDING' && isExpired(request.expiresAt),
      recipientRegistered:
        (await this.findReceiver(request.receiverEmail)) !== null,
    };
  }

  async respondByToken(token: string, action: Action) {
    const request = await this.findByTokenOrThrow(token);

    if (action === 'reject') {
      return this.toResponse(await this.reject(request));
    }

    this.assertRespondable(request);
    const receiver = await this.findReceiver(request.receiverEmail);
    if (!receiver) {
      throw new ConflictException({
        statusCode: 409,
        code: 'REGISTRATION_REQUIRED',
        message: 'Create an account with this email address to accept',
        email: request.receiverEmail,
      });
    }
    return this.toResponse(await this.accept(request, receiver.id));
  }
}
