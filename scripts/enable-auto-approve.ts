import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Connecting to database...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
  
  try {
    // Enable auto-approve
    const settings = await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: { autoApproveEnabled: true },
      create: { id: 1, autoApproveEnabled: true },
    });
    
    console.log('✓ Auto-approve enabled:', settings.autoApproveEnabled);
    
    // Approve any pending questions
    const updatedQuestions = await prisma.question.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED' }
    });
    console.log(`✓ Approved ${updatedQuestions.count} pending questions`);
    
    // Approve any pending answers  
    const updatedAnswers = await prisma.answer.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED' }
    });
    console.log(`✓ Approved ${updatedAnswers.count} pending answers`);
    
    // List all questions
    const questions = await prisma.question.findMany({
      select: { id: true, title: true, status: true }
    });
    console.log('\nAll questions:');
    questions.forEach(q => {
      console.log(`  - [${q.status}] ${q.title}`);
    });
    
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
