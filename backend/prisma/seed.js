import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', color: '#f59e0b', type: 'EXPENSE' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', type: 'EXPENSE' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'EXPENSE' },
  { name: 'Housing', icon: '🏠', color: '#8b5cf6', type: 'EXPENSE' },
  { name: 'Healthcare', icon: '🏥', color: '#ef4444', type: 'EXPENSE' },
  { name: 'Entertainment', icon: '🎬', color: '#f97316', type: 'EXPENSE' },
  { name: 'Education', icon: '📚', color: '#06b6d4', type: 'EXPENSE' },
  { name: 'Travel', icon: '✈️', color: '#10b981', type: 'EXPENSE' },
  { name: 'Utilities', icon: '💡', color: '#fbbf24', type: 'EXPENSE' },
  { name: 'Personal Care', icon: '💅', color: '#f472b6', type: 'EXPENSE' },
  { name: 'Subscriptions', icon: '📱', color: '#6366f1', type: 'EXPENSE' },
  { name: 'Other Expenses', icon: '💸', color: '#6b7280', type: 'EXPENSE' },
  { name: 'Salary', icon: '💼', color: '#10b981', type: 'INCOME' },
  { name: 'Freelance', icon: '💻', color: '#06b6d4', type: 'INCOME' },
  { name: 'Business', icon: '🏢', color: '#8b5cf6', type: 'INCOME' },
  { name: 'Investment', icon: '📈', color: '#f59e0b', type: 'INCOME' },
  { name: 'Gift', icon: '🎁', color: '#ec4899', type: 'INCOME' },
  { name: 'Other Income', icon: '💰', color: '#6b7280', type: 'INCOME' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  for (const category of DEFAULT_CATEGORIES) {
    const id = `default-${category.name.toLowerCase().replace(/[\s&]+/g, '-')}`;
    await prisma.category.upsert({
      where: { id },
      create: { id, ...category, isDefault: true, userId: null },
      update: { name: category.name, icon: category.icon, color: category.color },
    });
  }
  console.log(`✅ ${DEFAULT_CATEGORIES.length} default categories created`);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartbudget.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      username: process.env.ADMIN_USERNAME || 'admin',
      firstName: process.env.ADMIN_FIRST_NAME || 'System',
      lastName: process.env.ADMIN_LAST_NAME || 'Admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    update: { passwordHash, role: 'ADMIN' },
  });

  console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
