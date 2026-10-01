import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const DEFAULT_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Food & Dining', icon: '🍔' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Transportation', icon: '🚗' },
  { name: 'Housing & Rent', icon: '🏠' },
  { name: 'Utilities', icon: '💡' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Health & Fitness', icon: '💊' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Education', icon: '📚' },
  { name: 'Personal Care', icon: '💇' },
  { name: 'Bills & Subscriptions', icon: '📄' },
  { name: 'Gifts & Donations', icon: '🎁' },
  { name: 'Other', icon: '📦' },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  for (const { name, icon } of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { userId: null, name },
    });
    if (!existing) {
      await prisma.category.create({
        data: { name, icon, isDefault: true, userId: null },
      });
    }
  }

  await prisma.$disconnect();
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories (idempotent).`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
