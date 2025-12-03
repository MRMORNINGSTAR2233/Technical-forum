import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✓ Connected to database');
    
    const settings = await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: { autoApproveEnabled: true },
      create: { id: 1, autoApproveEnabled: true },
    });
    
    console.log('✓ Auto-approve enabled:', settings.autoApproveEnabled);
    console.log('All new posts will be automatically approved without moderation.');
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
