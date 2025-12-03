'use server';

import { prisma } from '@/lib/prisma';
import { rankQuestionsByHotScore, HotQuestion } from '@/lib/hot-questions';

/**
 * Fetch top hot questions (approved only)
 * Combines views, votes, answers, and recency
 */
export async function getHotQuestions(limit: number = 5): Promise<HotQuestion[]> {
  try {
    // Fetch recent approved questions (last 7 days for performance)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const questions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        title: true,
        views: true,
        createdAt: true,
        votes: {
          select: {
            value: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      take: 100, // Limit to 100 for performance
    });

    // Calculate vote scores and prepare for ranking
    const questionsWithScores = questions.map((q) => ({
      id: q.id,
      title: q.title,
      views: q.views,
      voteScore: q.votes.reduce((sum, vote) => sum + vote.value, 0),
      answerCount: q._count.answers,
      createdAt: q.createdAt,
    }));

    // Rank by hot score
    const rankedQuestions = rankQuestionsByHotScore(questionsWithScores);

    // Return top N
    return rankedQuestions.slice(0, limit);
  } catch (error) {
    console.error('Error fetching hot questions:', error);
    return [];
  }
}

/**
 * Get hot questions with caching
 * Cache for 5 minutes
 */
let cachedHotQuestions: HotQuestion[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedHotQuestions(limit: number = 5): Promise<HotQuestion[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedHotQuestions && now - cacheTimestamp < CACHE_DURATION) {
    return cachedHotQuestions.slice(0, limit);
  }

  // Fetch fresh data
  const hotQuestions = await getHotQuestions(limit);

  // Update cache
  cachedHotQuestions = hotQuestions;
  cacheTimestamp = now;

  return hotQuestions;
}
