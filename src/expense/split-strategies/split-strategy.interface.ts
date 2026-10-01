import { Prisma, SplitType } from '../../../generated/prisma/client';

export interface SplitParticipantInput {
  userId: number;
  value?: number;
}

export interface ComputedParticipantShare {
  userId: number;
  shareAmount: Prisma.Decimal;
  inputValue: Prisma.Decimal | null;
}

export interface SplitStrategy {
  readonly type: SplitType;
  compute(
    totalAmount: Prisma.Decimal,
    participants: SplitParticipantInput[],
  ): ComputedParticipantShare[];
}
