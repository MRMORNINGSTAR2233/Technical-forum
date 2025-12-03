import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create or update GlobalSettings
  const settings = await prisma.globalSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      autoApproveEnabled: false,
    },
  });

  console.log('Created GlobalSettings:', settings);

  // Create a test moderator profile (optional for development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: You can create test data here');
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
