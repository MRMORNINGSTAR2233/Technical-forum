'use server';

import { prisma } from '@/lib/prisma';

export interface CommunityStats {
  questionCount: number;
  answerCount: number;
  userCount: number;
  tagCount: number;
}

export interface FeaturedTag {
  id: string;
  name: string;
  questionCount: number;
}

/**
 * Get community statistics
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  try {
    const [questionCount, answerCount, userCount, tagCount] = await Promise.all([
      prisma.question.count({
        where: { status: 'APPROVED' },
      }),
      prisma.answer.count({
        where: { status: 'APPROVED' },
      }),
      prisma.profile.count({
        where: { pseudonym: { not: null } },
      }),
      prisma.tag.count(),
    ]);

    return {
      questionCount,
      answerCount,
      userCount,
      tagCount,
    };
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return {
      questionCount: 0,
      answerCount: 0,
      userCount: 0,
      tagCount: 0,
    };
  }
}

/**
 * Get featured/popular tags (top 6 by question count)
 */
export async function getFeaturedTags(): Promise<FeaturedTag[]> {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        questions: {
          where: { status: 'APPROVED' },
          select: { id: true },
        },
      },
      orderBy: {
        questions: {
          _count: 'desc',
        },
      },
      take: 6,
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      questionCount: tag.questions.length,
    }));
  } catch (error) {
    console.error('Error fetching featured tags:', error);
    return [];
  }
}
