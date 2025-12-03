'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { getAutoApproveStatus } from './settings';
import { revalidatePath } from 'next/cache';
import { PostStatus } from '@prisma/client';
import { validateAnswerContent } from '@/lib/content-moderation';

export async function createAnswer(questionId: string, content: string) {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in to post an answer' };
  }

  if (!user.profile.pseudonym) {
    return { error: 'You must set a pseudonym before posting answers' };
  }

  // Validate inputs
  if (!content || content.trim().length === 0) {
    return { error: 'Content is required' };
  }

  // Content moderation check
  const validation = validateAnswerContent(content);
  if (!validation.isValid) {
    return {
      error: validation.reason || 'Content validation failed',
      suggestions: validation.suggestions,
    };
  }

  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return { error: 'Question not found' };
  }

  try {
    // Get auto-approve setting to determine initial status
    const autoApprove = await getAutoApproveStatus();
    const status: PostStatus = autoApprove ? 'APPROVED' : 'PENDING';

    // Create answer
    const answer = await prisma.answer.create({
      data: {
        content,
        status,
        questionId,
        authorId: user.profile.id,
      },
      include: {
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
      revalidatePath(`/questions/${questionId}`);
    } catch (_e) {
      // Ignore revalidation errors in test environment
    }

    return { answerId: answer.id };
  } catch (error) {
    console.error('Error creating answer:', error);
    return { error: 'Failed to create answer' };
  }
}

export async function acceptAnswer(answerId: string, questionId: string) {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in' };
  }

  try {
    // Verify the question exists and user is the author
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { authorId: true },
    });

    if (!question) {
      return { error: 'Question not found' };
    }

    if (question.authorId !== user.profile.id) {
      return { error: 'Only the question author can accept answers' };
    }

    // Verify the answer exists and belongs to this question
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { questionId: true, authorId: true },
    });

    if (!answer) {
      return { error: 'Answer not found' };
    }

    if (answer.questionId !== questionId) {
      return { error: 'Answer does not belong to this question' };
    }

    // Use a transaction to ensure only one accepted answer
    await prisma.$transaction(async (tx) => {
      // Unaccept all other answers for this question
      await tx.answer.updateMany({
        where: {
          questionId,
          isAccepted: true,
        },
        data: {
          isAccepted: false,
        },
      });

      // Accept the specified answer
      await tx.answer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      });

      // Update reputation for the answer author (+15 points)
      await tx.profile.update({
        where: { id: answer.authorId },
        data: {
          reputation: {
            increment: 15,
          },
        },
      });
    });

    try {
      revalidatePath(`/questions/${questionId}`);
    } catch (_e) {
      // Ignore revalidation errors in test environment
    }

    return { success: true };
  } catch (error) {
    console.error('Error accepting answer:', error);
    return { error: 'Failed to accept answer' };
  }
}

export async function getAnswersForQuestion(questionId: string) {
  try {
    const answers = await prisma.answer.findMany({
      where: {
        questionId,
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
    });

    // Calculate vote scores for each answer
    const answersWithScores = await Promise.all(
      answers.map(async (answer) => {
        const votes = await prisma.vote.findMany({
          where: { answerId: answer.id },
          select: { value: true },
        });

        const voteScore = votes.reduce((sum, vote) => sum + vote.value, 0);

        return {
          ...answer,
          voteScore,
        };
      })
    );

    return answersWithScores;
  } catch (error) {
    console.error('Error fetching answers:', error);
    return [];
  }
}
