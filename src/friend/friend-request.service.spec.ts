import {
  BadRequestException,
  ConflictException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FriendRequest } from '../../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { FriendRequestService } from './friend-request.service';
import { FriendService } from './friend.service';
import { hashToken } from './friend-token.util';

const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

const makeRequest = (over: Partial<FriendRequest> = {}): FriendRequest => ({
  id: 1,
  senderId: 1,
  receiverEmail: 'bob@example.com',
  tokenHash: 'hash',
  status: 'PENDING',
  expiresAt: future(),
  lastSentAt: new Date(),
  sendCount: 1,
  respondedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('FriendRequestService', () => {
  let prisma: {
    user: { findFirst: jest.Mock; findUnique: jest.Mock };
    friendRequest: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let friends: { areFriends: jest.Mock; createFriendship: jest.Mock };
  let mail: { sendFriendRequest: jest.Mock };
  let service: FriendRequestService;

  const alice = { id: 1, email: 'Alice@Example.com' };

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn(), findUnique: jest.fn() },
      friendRequest: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    friends = {
      areFriends: jest.fn().mockResolvedValue(false),
      createFriendship: jest.fn(),
    };
    mail = { sendFriendRequest: jest.fn().mockResolvedValue(true) };
    prisma.user.findUnique.mockResolvedValue({ name: 'Alice' });

    service = new FriendRequestService(
      prisma as unknown as PrismaService,
      friends as unknown as FriendService,
      mail as unknown as MailService,
      new ConfigService({ FRONTEND_URL: 'http://app.test/' }),
    );
  });

  describe('send', () => {
    it('rejects a request to yourself (case-insensitive)', async () => {
      await expect(
        service.send(alice, ' ALICE@example.com '),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when already friends', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 2 });
      friends.areFriends.mockResolvedValue(true);
      await expect(
        service.send(alice, 'bob@example.com'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a request and emails a link for an unregistered address', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.friendRequest.findUnique.mockResolvedValue(null);
      prisma.friendRequest.create.mockImplementation(
        ({ data }: { data: Partial<FriendRequest> }) =>
          Promise.resolve(makeRequest(data)),
      );

      const res = await service.send(alice, 'Bob@Example.com');

      expect(res.receiverEmail).toBe('bob@example.com');
      expect(res.status).toBe('PENDING');
      expect(res).not.toHaveProperty('tokenHash');
      const mailArg = (
        mail.sendFriendRequest.mock.calls as [
          { link: string; recipientRegistered: boolean },
        ][]
      )[0][0];
      expect(mailArg.recipientRegistered).toBe(false);
      const token = mailArg.link.split('token=')[1];
      expect(mailArg.link.startsWith('http://app.test/friends/respond')).toBe(
        true,
      );
      const created = (
        prisma.friendRequest.create.mock.calls as [
          { data: { tokenHash: string } },
        ][]
      )[0][0];
      expect(created.data.tokenHash).toBe(hashToken(token));
    });

    it('is idempotent for an existing live pending request', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 2 });
      prisma.friendRequest.findUnique
        .mockResolvedValueOnce(null) // reverse
        .mockResolvedValueOnce(makeRequest()); // existing
      const res = await service.send(alice, 'bob@example.com');
      expect(res.id).toBe(1);
      expect(prisma.friendRequest.create).not.toHaveBeenCalled();
      expect(mail.sendFriendRequest).not.toHaveBeenCalled();
    });

    it('auto-accepts when the other person already asked', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 2 });
      const reverse = makeRequest({
        id: 9,
        senderId: 2,
        receiverEmail: 'alice@example.com',
      });
      prisma.friendRequest.findUnique.mockResolvedValue(reverse);
      prisma.friendRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.friendRequest.findUniqueOrThrow.mockResolvedValue({
        ...reverse,
        status: 'ACCEPTED',
      });

      const res = await service.send(alice, 'bob@example.com');

      expect(res.status).toBe('ACCEPTED');
      expect(friends.createFriendship).toHaveBeenCalledWith(prisma, 2, 1);
      expect(mail.sendFriendRequest).not.toHaveBeenCalled();
    });

    it('blocks a re-request soon after a rejection', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 2 });
      prisma.friendRequest.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          makeRequest({ status: 'REJECTED', respondedAt: new Date() }),
        );
      await expect(
        service.send(alice, 'bob@example.com'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('reuses an expired request row with a fresh token', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 2 });
      prisma.friendRequest.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeRequest({ expiresAt: past() }));
      prisma.friendRequest.update.mockImplementation(
        ({ data }: { data: Partial<FriendRequest> }) =>
          Promise.resolve(makeRequest(data)),
      );
      await service.send(alice, 'bob@example.com');
      expect(prisma.friendRequest.update).toHaveBeenCalled();
      expect(mail.sendFriendRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('respond (in-app)', () => {
    const bob = { id: 2, email: 'bob@example.com' };

    it('404s for a request addressed to someone else', async () => {
      prisma.friendRequest.findFirst.mockResolvedValue(null);
      await expect(service.respond(bob, 1, 'accept')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects an expired request', async () => {
      prisma.friendRequest.findFirst.mockResolvedValue(
        makeRequest({ expiresAt: past() }),
      );
      await expect(service.respond(bob, 1, 'accept')).rejects.toBeInstanceOf(
        GoneException,
      );
    });

    it('rejects a request that was already answered', async () => {
      prisma.friendRequest.findFirst.mockResolvedValue(
        makeRequest({ status: 'REJECTED' }),
      );
      await expect(service.respond(bob, 1, 'reject')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('accept creates the friendship for sender and receiver', async () => {
      const request = makeRequest();
      prisma.friendRequest.findFirst.mockResolvedValue(request);
      prisma.friendRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.friendRequest.findUniqueOrThrow.mockResolvedValue({
        ...request,
        status: 'ACCEPTED',
      });
      const res = await service.respond(bob, 1, 'accept');
      expect(res.status).toBe('ACCEPTED');
      expect(friends.createFriendship).toHaveBeenCalledWith(prisma, 1, 2);
    });
  });

  describe('respondByToken', () => {
    it('asks an unregistered recipient to register first', async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        ...makeRequest(),
        sender: { name: 'Alice' },
      });
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.respondByToken('tok', 'accept'),
      ).rejects.toMatchObject({
        response: { code: 'REGISTRATION_REQUIRED', email: 'bob@example.com' },
      });
      expect(friends.createFriendship).not.toHaveBeenCalled();
    });

    it('404s for an unknown token', async () => {
      prisma.friendRequest.findUnique.mockResolvedValue(null);
      await expect(service.tokenDetails('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
