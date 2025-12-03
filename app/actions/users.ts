'use server';

import { prisma } from '@/lib/prisma';

export interface UserProfile {
  id: string;
  pseudonym: string | null;
  reputation: number;
  role: string;
  createdAt: Date;
  questionCount: number;
  answerCount: number;
}

export interface UserProfileDetail extends UserProfile {
  questions: {
    id: string;
    title: string;
    voteScore: number;
    answerCount: number;
    views: number;
    createdAt: Date;
  }[];
  answers: {
    id: string;
    content: string;
    voteScore: number;
    isAccepted: boolean;
    createdAt: Date;
    question: {
      id: string;
      title: string;
    };
  }[];
}

/**
 * Fetch all users sorted by reputation
 * Email is excluded from all responses
 */
export async function getUsers(
  page: number = 1,
  pageSize: number = 20
): Promise<UserProfile[]> {
  try {
    const skip = (page - 1) * pageSize;

    const users = await prisma.profile.findMany({
      select: {
        id: true,
        pseudonym: true,
        reputation: true,
        role: true,
        createdAt: true,
        // Email is explicitly excluded (userId is not selected)
        _count: {
          select: {
            questions: true,
            answers: true,
          },
        },
      },
      orderBy: {
        reputation: 'desc',
      },
      skip,
      take: pageSize,
    });

    return users.map((user) => ({
      id: user.id,
      pseudonym: user.pseudonym,
      reputation: user.reputation,
      role: user.role,
      createdAt: user.createdAt,
      questionCount: user._count.questions,
      answerCount: user._count.answers,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get total count of users
 */
export async function getUserCount(): Promise<number> {
  try {
    return await prisma.profile.count();
  } catch (error) {
    console.error('Error getting user count:', error);
    return 0;
  }
}

/**
 * Fetch user profile by pseudonym with their questions and answers
 * Email is excluded from response
 */
export async function getUserByPseudonym(
  pseudonym: string
): Promise<UserProfileDetail | null> {
  try {
    const user = await prisma.profile.findUnique({
      where: { pseudonym },
      select: {
        id: true,
        pseudonym: true,
        reputation: true,
        role: true,
        createdAt: true,
        // Email is explicitly excluded (userId is not selected)
        questions: {
          where: {
            status: 'APPROVED',
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
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        answers: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
            content: true,
            isAccepted: true,
            createdAt: true,
            votes: {
              select: {
                value: true,
              },
            },
            question: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            questions: true,
            answers: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      pseudonym: user.pseudonym,
      reputation: user.reputation,
      role: user.role,
      createdAt: user.createdAt,
      questionCount: user._count.questions,
      answerCount: user._count.answers,
      questions: user.questions.map((q) => ({
        id: q.id,
        title: q.title,
        voteScore: q.votes.reduce((sum, vote) => sum + vote.value, 0),
        answerCount: q._count.answers,
        views: q.views,
        createdAt: q.createdAt,
      })),
      answers: user.answers.map((a) => ({
        id: a.id,
        content: a.content,
        voteScore: a.votes.reduce((sum, vote) => sum + vote.value, 0),
        isAccepted: a.isAccepted,
        createdAt: a.createdAt,
        question: a.question,
      })),
    };
  } catch (error) {
    console.error('Error fetching user by pseudonym:', error);
    return null;
  }
}

/**
 * Search users by pseudonym
 */
export async function searchUsers(query: string): Promise<UserProfile[]> {
  try {
    if (!query.trim()) {
      return [];
    }

    const users = await prisma.profile.findMany({
      where: {
        pseudonym: {
          contains: query.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        pseudonym: true,
        reputation: true,
        role: true,
        createdAt: true,
        // Email is explicitly excluded
        _count: {
          select: {
            questions: true,
            answers: true,
          },
        },
      },
      orderBy: {
        reputation: 'desc',
      },
      take: 20,
    });

    return users.map((user) => ({
      id: user.id,
      pseudonym: user.pseudonym,
      reputation: user.reputation,
      role: user.role,
      createdAt: user.createdAt,
      questionCount: user._count.questions,
      answerCount: user._count.answers,
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}
