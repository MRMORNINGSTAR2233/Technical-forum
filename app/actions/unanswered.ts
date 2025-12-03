'use server';

import { prisma } from '@/lib/prisma';

export interface UnansweredQuestion {
  id: string;
  title: string;
  content: string;
  views: number;
  voteScore: number;
  status: string;
  createdAt: Date;
  author: {
    pseudonym: string | null;
    reputation: number;
  };
  tags: {
    id: string;
    name: string;
  }[];
}

/**
 * Fetch unanswered questions (zero answers, approved only)
 * Sorted by most recent first
 */
export async function getUnansweredQuestions(
  page: number = 1,
  pageSize: number = 20
): Promise<UnansweredQuestion[]> {
  try {
    const skip = (page - 1) * pageSize;

    const questions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        answers: {
          none: {},
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        views: true,
        status: true,
        createdAt: true,
        author: {
          select: {
            pseudonym: true,
            reputation: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        votes: {
          select: {
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    // Calculate vote scores
    const questionsWithScores: UnansweredQuestion[] = questions.map((q) => ({
      id: q.id,
      title: q.title,
      content: q.content,
      views: q.views,
      voteScore: q.votes.reduce((sum, vote) => sum + vote.value, 0),
      status: q.status,
      createdAt: q.createdAt,
      author: q.author,
      tags: q.tags,
    }));

    return questionsWithScores;
  } catch (error) {
    console.error('Error fetching unanswered questions:', error);
    return [];
  }
}

/**
 * Get count of unanswered questions (approved only)
 */
export async function getUnansweredCount(): Promise<number> {
  try {
    const count = await prisma.question.count({
      where: {
        status: 'APPROVED',
        answers: {
          none: {},
        },
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting unanswered count:', error);
    return 0;
  }
}

/**
 * Check if a question is unanswered
 */
export async function isQuestionUnanswered(questionId: string): Promise<boolean> {
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    return question ? question._count.answers === 0 : false;
  } catch (error) {
    console.error('Error checking if question is unanswered:', error);
    return false;
  }
}
