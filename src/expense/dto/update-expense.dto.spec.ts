import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SplitType } from '../../../generated/prisma/client';
import { UpdateExpenseDto } from './update-expense.dto';

describe('UpdateExpenseDto', () => {
  it('allows splitType to be omitted entirely', async () => {
    const dto = plainToInstance(UpdateExpenseDto, { amount: 10 });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('accepts a valid splitType with participants', async () => {
    const dto = plainToInstance(UpdateExpenseDto, {
      splitType: SplitType.EQUAL,
      participants: [{ userId: 1 }, { userId: 2 }],
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('rejects an explicit splitType: null instead of silently accepting it', async () => {
    const dto = plainToInstance(UpdateExpenseDto, {
      splitType: null,
      participants: [{ userId: 1 }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'splitType')).toBe(true);
  });
});
