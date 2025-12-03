'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { getAutoApproveStatus } from './settings';
import { revalidatePath } from 'next/cache';
import { PostStatus } from '@prisma/client';

export async function createQuestion(
  title: string,
  content: string,
  tagNames: string[]
) {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in to create a question' };
  }

  if (!user.profile.pseudonym) {
    return { error: 'You must set a pseudonym before posting questions' };
  }

  // Validate inputs
  if (!title || title.trim().length === 0) {
    return { error: 'Title is required' };
  }

  if (title.length > 300) {
    return { error: 'Title must be 300 characters or less' };
  }

  if (!content || content.trim().length === 0) {
    return { error: 'Content is required' };
  }

  if (content.length > 30000) {
    return { error: 'Content must be 30,000 characters or less' };
  }

  try {
    // Get auto-approve setting to determine initial status
    const autoApprove = await getAutoApproveStatus();
    const status: PostStatus = autoApprove ? 'APPROVED' : 'PENDING';

    // Process tags: create new or connect existing
    const tagOperations = await Promise.all(
      tagNames.map(async (tagName) => {
        const sanitizedTag = tagName.trim().toLowerCase();
        
        // Find or create tag
        const tag = await prisma.tag.upsert({
          where: { name: sanitizedTag },
          update: {},
          create: { name: sanitizedTag },
        });
        
        return { id: tag.id };
      })
    );

    // Create question with tags
    const question = await prisma.question.create({
      data: {
        title: title.trim(),
        content,
        status,
        authorId: user.profile.id,
        tags: {
          connect: tagOperations,
        },
      },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            pseudonym: true,
            reputation: true,
          },
        },
      },
    });

    try {
      revalidatePath('/');
      revalidatePath('/questions');
    } catch (e) {
      // Ignore revalidation errors in test environment
    }

    return { questionId: question.id };
  } catch (error) {
    console.error('Error creating question:', error);
    return { error: 'Failed to create question' };
  }
}

export async function getQuestions(
  filter: 'all' | 'unanswered' | 'hot' = 'all',
  page: number = 1,
  pageSize: number = 20
) {
  const skip = (page - 1) * pageSize;

  try {
    let whereClause: any = {
      status: 'APPROVED',
    };

    if (filter === 'unanswered') {
      whereClause.answers = {
        none: {},
      };
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            pseudonym: true,
            reputation: true,
          },
        },
        tags: true,
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
      orderBy:
        filter === 'hot'
          ? [{ views: 'desc' }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    // Calculate vote scores for each question
    const questionsWithScores = await Promise.all(
      questions.map(async (question) => {
        const votes = await prisma.vote.findMany({
          where: { questionId: question.id },
          select: { value: true },
        });

        const voteScore = votes.reduce((sum, vote) => sum + vote.value, 0);

        return {
          ...question,
          voteScore,
        };
      })
    );

    return questionsWithScores;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

export async function getQuestionById(id: string) {
  try {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            pseudonym: true,
            reputation: true,
          },
        },
        tags: true,
        answers: {
          where: {
            status: 'APPROVED',
          },
          include: {
            author: {
              select: {
                id: true,
                pseudonym: true,
                reputation: true,
              },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
        },
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
    });

    if (!question) {
      return null;
    }

    // Calculate vote score for question
    const questionVotes = await prisma.vote.findMany({
      where: { questionId: question.id },
      select: { value: true },
    });

    const questionVoteScore = questionVotes.reduce(
      (sum, vote) => sum + vote.value,
      0
    );

    // Calculate vote scores for each answer
    const answersWithScores = await Promise.all(
      question.answers.map(async (answer) => {
        const answerVotes = await prisma.vote.findMany({
          where: { answerId: answer.id },
          select: { value: true },
        });

        const answerVoteScore = answerVotes.reduce(
          (sum, vote) => sum + vote.value,
          0
        );

        return {
          ...answer,
          voteScore: answerVoteScore,
        };
      })
    );

    return {
      ...question,
      voteScore: questionVoteScore,
      answers: answersWithScores,
    };
  } catch (error) {
    console.error('Error fetching question:', error);
    return null;
  }
}

export async function incrementViewCount(questionId: string) {
  try {
    await prisma.question.update({
      where: { id: questionId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    try {
      revalidatePath(`/questions/${questionId}`);
    } catch (e) {
      // Ignore revalidation errors in test environment
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

export async function searchQuestions(query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const searchTerm = query.trim().toLowerCase();

    // Search in title, content, and tags
    const questions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              some: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            pseudonym: true,
            reputation: true,
          },
        },
        tags: true,
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Calculate vote scores
    const questionsWithScores = await Promise.all(
      questions.map(async (question) => {
        const votes = await prisma.vote.findMany({
          where: { questionId: question.id },
          select: { value: true },
        });

        const voteScore = votes.reduce((sum, vote) => sum + vote.value, 0);

        return {
          ...question,
          voteScore,
        };
      })
    );

    return questionsWithScores;
  } catch (error) {
    console.error('Error searching questions:', error);
    return [];
  }
}
