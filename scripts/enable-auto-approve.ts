import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  try {
    // Get the most recent user
    const latestProfile = await prisma.profile.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (latestProfile) {
      // Update user to MODERATOR
      await prisma.profile.update({
        where: { id: latestProfile.id },
        data: { role: 'MODERATOR' },
      });
      console.log(`✅ Updated user ${latestProfile.pseudonym} to MODERATOR`);
    }

    // Enable auto-approve
    await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: { autoApproveEnabled: true },
      create: { id: 1, autoApproveEnabled: true },
    });
    console.log('✅ Enabled auto-approve');

    // Approve all pending questions
    const result = await prisma.question.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED' },
    });
    console.log(`✅ Approved ${result.count} pending questions`);

    // Approve all pending answers
    const answerResult = await prisma.answer.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED' },
    });
    console.log(`✅ Approved ${answerResult.count} pending answers`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
