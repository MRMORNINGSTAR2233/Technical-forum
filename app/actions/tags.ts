'use server';

import { prisma } from '@/lib/prisma';

export interface TagWithCount {
  id: string;
  name: string;
  questionCount: number;
  createdAt: Date;
}

export interface QuestionSummary {
  id: string;
  title: string;
  content: string;
  views: number;
  voteScore: number;
  answerCount: number;
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
 * Fetch all tags with their question counts
 * Only counts approved questions
 */
export async function getAllTags(): Promise<TagWithCount[]> {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        questions: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Map to include question count
    const tagsWithCount: TagWithCount[] = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      questionCount: tag.questions.length,
      createdAt: tag.createdAt,
    }));

    return tagsWithCount;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Fetch questions filtered by tag
 * Only returns approved questions
 */
export async function getQuestionsByTag(
  tagName: string,
  page: number = 1,
  pageSize: number = 20
): Promise<QuestionSummary[]> {
  try {
    const skip = (page - 1) * pageSize;

    const questions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        tags: {
          some: {
            name: tagName.toLowerCase(),
          },
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
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    // Calculate vote scores and map to QuestionSummary
    const questionsWithScores: QuestionSummary[] = questions.map((q) => ({
      id: q.id,
      title: q.title,
      content: q.content,
      views: q.views,
      voteScore: q.votes.reduce((sum, vote) => sum + vote.value, 0),
      answerCount: q._count.answers,
      status: q.status,
      createdAt: q.createdAt,
      author: q.author,
      tags: q.tags,
    }));

    return questionsWithScores;
  } catch (error) {
    console.error('Error fetching questions by tag:', error);
    return [];
  }
}

/**
 * Get a single tag by name with its question count
 */
export async function getTagByName(
  tagName: string
): Promise<TagWithCount | null> {
  try {
    const tag = await prisma.tag.findUnique({
      where: {
        name: tagName.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        questions: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!tag) {
      return null;
    }

    return {
      id: tag.id,
      name: tag.name,
      questionCount: tag.questions.length,
      createdAt: tag.createdAt,
    };
  } catch (error) {
    console.error('Error fetching tag by name:', error);
    return null;
  }
}

/**
 * Get popular tags (sorted by question count)
 */
export async function getPopularTags(limit: number = 10): Promise<TagWithCount[]> {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        questions: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Map to include question count and sort by count
    const tagsWithCount: TagWithCount[] = tags
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        questionCount: tag.questions.length,
        createdAt: tag.createdAt,
      }))
      .filter((tag) => tag.questionCount > 0) // Only tags with questions
      .sort((a, b) => b.questionCount - a.questionCount)
      .slice(0, limit);

    return tagsWithCount;
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    return [];
  }
}
