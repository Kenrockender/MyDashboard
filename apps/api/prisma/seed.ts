// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: { email: 'you@example.com', name: 'Solo Dev' },
  });

  const client = await prisma.client.create({
    data: { userId: user.id, name: 'Acme Corp', email: 'billing@acme.com' },
  });

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      clientId: client.id,
      name: 'Acme Website Redesign',
      status: 'active',
      startDate: new Date('2026-06-01'),
    },
  });

  await prisma.income.create({
    data: { projectId: project.id, amount: 2000, description: 'Down payment', status: 'paid', date: new Date('2026-06-01') },
  });

  await prisma.expense.create({
    data: { projectId: project.id, amount: 20, category: 'domain', description: 'Domain renewal', date: new Date('2026-06-02') },
  });

  console.log('Seeded user id:', user.id);
}

main().finally(() => prisma.$disconnect());
