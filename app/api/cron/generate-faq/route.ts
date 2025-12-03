import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFAQ } from '@/lib/groq';

/**
 * Cron job to generate FAQs from high-quality Q&A pairs
 * Runs daily at midnight
 * 
 * Eligible questions:
 * - Created in last 24 hours
 * - Status: APPROVED
 * - Has at least one answer with positive vote count
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Groq API is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API not configured', generated: 0 },
        { status: 200 }
      );
    }

    // Fetch eligible questions from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const eligibleQuestions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        answers: {
          some: {
            status: 'APPROVED',
            votes: {
              some: {
                value: {
                  gt: 0,
                },
              },
            },
          },
        },
      },
      include: {
        answers: {
          where: {
            status: 'APPROVED',
          },
          include: {
            votes: {
              select: {
                value: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      take: 10, // Limit to 10 questions per run to avoid rate limits
    });

    let generatedCount = 0;
    const errors: string[] = [];

    // Process each eligible question
    for (const question of eligibleQuestions) {
      try {
        // Find the best answer (highest vote score)
        const answersWithScores = question.answers.map((answer) => ({
          ...answer,
          voteScore: answer.votes.reduce((sum, vote) => sum + vote.value, 0),
        }));

        const bestAnswer = answersWithScores.sort((a, b) => b.voteScore - a.voteScore)[0];

        if (!bestAnswer || bestAnswer.voteScore <= 0) {
          continue;
        }

        // Check if FAQ already exists for this question
        const existingFAQ = await prisma.aI_FAQ.findFirst({
          where: {
            sourceQuestionId: question.id,
          },
        });

        if (existingFAQ) {
          continue; // Skip if FAQ already generated
        }

        // Generate FAQ using Groq AI
        const faqOutput = await generateFAQ({
          questionTitle: question.title,
          questionContent: question.content,
          answerContent: bestAnswer.content,
          questionId: question.id,
        });

        if (!faqOutput) {
          errors.push(`Failed to generate FAQ for question ${question.id}`);
          continue;
        }

        // Store FAQ in database
        await prisma.aI_FAQ.create({
          data: {
            topic: faqOutput.tags.join(', '),
            question: faqOutput.question,
            answer: faqOutput.answer,
            sourceQuestionId: question.id,
          },
        });

        generatedCount++;
      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        errors.push(`Error processing question ${question.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      generated: generatedCount,
      eligible: eligibleQuestions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in FAQ generation cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error', generated: 0 },
      { status: 500 }
    );
  }
}
