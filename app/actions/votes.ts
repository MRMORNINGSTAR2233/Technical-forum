'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

export async function voteOnQuestion(
  questionId: string,
  value: 1 | -1
) {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in to vote' };
  }

  try {
    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { authorId: true },
    });

    if (!question) {
      return { error: 'Question not found' };
    }

    // Prevent voting on own posts
    if (question.authorId === user.profile.id) {
      return { error: 'You cannot vote on your own posts' };
    }

    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        profileId_questionId: {
          profileId: user.profile.id,
          questionId,
        },
      },
    });

    let reputationChange = 0;

    if (existingVote) {
      // Update existing vote
      if (existingVote.value === value) {
        // Same vote - remove it (toggle off)
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });
        // Reverse reputation change
        reputationChange = existingVote.value === 1 ? -5 : 2;
      } else {
        // Different vote - update it
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value },
        });
        // Calculate reputation change (from old to new)
        reputationChange = value === 1 ? 7 : -7; // +5 to -2 = 7, or -2 to +5 = -7
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          value,
          profileId: user.profile.id,
          questionId,
        },
      });
      reputationChange = value === 1 ? 5 : -2;
    }

    // Update author's reputation
    if (reputationChange !== 0) {
      await prisma.profile.update({
        where: { id: question.authorId },
        data: {
          reputation: {
            increment: reputationChange,
          },
        },
      });
    }

    // Calculate new vote score
    const votes = await prisma.vote.findMany({
      where: { questionId },
      select: { value: true },
    });
    const newScore = votes.reduce((sum, vote) => sum + vote.value, 0);

    try {
      revalidatePath(`/questions/${questionId}`);
    } catch (e) {
      // Ignore revalidation errors in test environment
    }

    return { success: true, newScore };
  } catch (error) {
    console.error('Error voting on question:', error);
    return { error: 'Failed to vote on question' };
  }
}

export async function voteOnAnswer(
  answerId: string,
  value: 1 | -1
) {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in to vote' };
  }

  try {
    // Check if answer exists
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { authorId: true, questionId: true },
    });

    if (!answer) {
      return { error: 'Answer not found' };
    }

    // Prevent voting on own posts
    if (answer.authorId === user.profile.id) {
      return { error: 'You cannot vote on your own posts' };
    }

    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        profileId_answerId: {
          profileId: user.profile.id,
          answerId,
        },
      },
    });

    let reputationChange = 0;

    if (existingVote) {
      // Update existing vote
      if (existingVote.value === value) {
        // Same vote - remove it (toggle off)
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });
        // Reverse reputation change
        reputationChange = existingVote.value === 1 ? -10 : 2;
      } else {
        // Different vote - update it
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value },
        });
        // Calculate reputation change (from old to new)
        reputationChange = value === 1 ? 12 : -12; // +10 to -2 = 12, or -2 to +10 = -12
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          value,
          profileId: user.profile.id,
          answerId,
        },
      });
      reputationChange = value === 1 ? 10 : -2;
    }

    // Update author's reputation
    if (reputationChange !== 0) {
      await prisma.profile.update({
        where: { id: answer.authorId },
        data: {
          reputation: {
            increment: reputationChange,
          },
        },
      });
    }

    // Calculate new vote score
    const votes = await prisma.vote.findMany({
      where: { answerId },
      select: { value: true },
    });
    const newScore = votes.reduce((sum, vote) => sum + vote.value, 0);

    try {
      revalidatePath(`/questions/${answer.questionId}`);
    } catch (e) {
      // Ignore revalidation errors in test environment
    }

    return { success: true, newScore };
  } catch (error) {
    console.error('Error voting on answer:', error);
    return { error: 'Failed to vote on answer' };
  }
}

export async function getUserVote(
  targetId: string,
  targetType: 'question' | 'answer'
) {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return null;
  }

  try {
    const vote = await prisma.vote.findFirst({
      where: {
        profileId: user.profile.id,
        ...(targetType === 'question'
          ? { questionId: targetId }
          : { answerId: targetId }),
      },
      select: { value: true },
    });

    return vote;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
}
