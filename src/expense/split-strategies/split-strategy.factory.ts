import { SplitType } from '../../../generated/prisma/client';
import { EqualSplitStrategy } from './equal-split.strategy';
import { ExactSplitStrategy } from './exact-split.strategy';
import { PercentageSplitStrategy } from './percentage-split.strategy';
import { SharesSplitStrategy } from './shares-split.strategy';
import { SplitStrategy } from './split-strategy.interface';

export function createSplitStrategy(type: SplitType): SplitStrategy {
  switch (type) {
    case SplitType.EQUAL:
      return new EqualSplitStrategy();
    case SplitType.PERCENTAGE:
      return new PercentageSplitStrategy();
    case SplitType.EXACT:
      return new ExactSplitStrategy();
    case SplitType.SHARES:
      return new SharesSplitStrategy();
  }
}
