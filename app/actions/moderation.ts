'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

export interface PendingPost {
  id: string;
  type: 'question' | 'answer';
  title?: string;
  content: string;
  author: {
    pseudonym: string | null;
  };
  createdAt: Date;
  isStale: boolean;
}

/**
 * Fetch all pending posts (questions and answers) for moderation
 * Only accessible to moderators
 */
export async function getPendingPosts(): Promise<PendingPost[] | { error: string }> {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in' };
  }

  if (user.profile.role !== 'MODERATOR') {
    return { error: 'Forbidden: Only moderators can access the moderation queue' };
  }

  try {
    // Fetch pending questions
    const pendingQuestions = await prisma.question.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            pseudonym: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch pending answers
    const pendingAnswers = await prisma.answer.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            pseudonym: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate stale threshold (2 hours ago)
    const staleThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Map questions to PendingPost format
    const questionPosts: PendingPost[] = pendingQuestions.map((q) => ({
      id: q.id,
      type: 'question' as const,
      title: q.title,
      content: q.content,
      author: q.author,
      createdAt: q.createdAt,
      isStale: q.createdAt < staleThreshold,
    }));

    // Map answers to PendingPost format
    const answerPosts: PendingPost[] = pendingAnswers.map((a) => ({
      id: a.id,
      type: 'answer' as const,
      content: a.content,
      author: a.author,
      createdAt: a.createdAt,
      isStale: a.createdAt < staleThreshold,
    }));

    // Combine and sort by creation date
    const allPosts = [...questionPosts, ...answerPosts].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    return allPosts;
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    return { error: 'Failed to fetch pending posts' };
  }
}

/**
 * Approve a pending post (question or answer)
 * Only accessible to moderators
 */
export async function approvePost(
  postId: string,
  postType: 'question' | 'answer'
): Promise<{ success: boolean } | { error: string }> {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in' };
  }

  if (user.profile.role !== 'MODERATOR') {
    return { error: 'Forbidden: Only moderators can approve posts' };
  }

  try {
    if (postType === 'question') {
      // Check if question exists and is pending
      const question = await prisma.question.findUnique({
        where: { id: postId },
        select: { status: true },
      });

      if (!question) {
        return { error: 'Question not found' };
      }

      if (question.status !== 'PENDING') {
        return { error: 'Question is not pending approval' };
      }

      // Update status to APPROVED
      await prisma.question.update({
        where: { id: postId },
        data: { status: 'APPROVED' },
      });

      revalidatePath('/mod/queue');
      revalidatePath('/questions');
    } else {
      // Check if answer exists and is pending
      const answer = await prisma.answer.findUnique({
        where: { id: postId },
        select: { status: true, questionId: true },
      });

      if (!answer) {
        return { error: 'Answer not found' };
      }

      if (answer.status !== 'PENDING') {
        return { error: 'Answer is not pending approval' };
      }

      // Update status to APPROVED
      await prisma.answer.update({
        where: { id: postId },
        data: { status: 'APPROVED' },
      });

      revalidatePath('/mod/queue');
      revalidatePath(`/questions/${answer.questionId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error approving post:', error);
    return { error: 'Failed to approve post' };
  }
}

/**
 * Reject a pending post (question or answer)
 * Only accessible to moderators
 */
export async function rejectPost(
  postId: string,
  postType: 'question' | 'answer'
): Promise<{ success: boolean } | { error: string }> {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in' };
  }

  if (user.profile.role !== 'MODERATOR') {
    return { error: 'Forbidden: Only moderators can reject posts' };
  }

  try {
    if (postType === 'question') {
      // Check if question exists and is pending
      const question = await prisma.question.findUnique({
        where: { id: postId },
        select: { status: true },
      });

      if (!question) {
        return { error: 'Question not found' };
      }

      if (question.status !== 'PENDING') {
        return { error: 'Question is not pending approval' };
      }

      // Update status to REJECTED
      await prisma.question.update({
        where: { id: postId },
        data: { status: 'REJECTED' },
      });

      revalidatePath('/mod/queue');
    } else {
      // Check if answer exists and is pending
      const answer = await prisma.answer.findUnique({
        where: { id: postId },
        select: { status: true, questionId: true },
      });

      if (!answer) {
        return { error: 'Answer not found' };
      }

      if (answer.status !== 'PENDING') {
        return { error: 'Answer is not pending approval' };
      }

      // Update status to REJECTED
      await prisma.answer.update({
        where: { id: postId },
        data: { status: 'REJECTED' },
      });

      revalidatePath('/mod/queue');
      revalidatePath(`/questions/${answer.questionId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting post:', error);
    return { error: 'Failed to reject post' };
  }
}

/**
 * Get count of pending posts
 * Only accessible to moderators
 */
export async function getPendingPostCount(): Promise<number | { error: string }> {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return { error: 'Unauthorized: You must be logged in' };
  }

  if (user.profile.role !== 'MODERATOR') {
    return 0; // Non-moderators see 0 pending posts
  }

  try {
    const [questionCount, answerCount] = await Promise.all([
      prisma.question.count({ where: { status: 'PENDING' } }),
      prisma.answer.count({ where: { status: 'PENDING' } }),
    ]);

    return questionCount + answerCount;
  } catch (error) {
    console.error('Error getting pending post count:', error);
    return { error: 'Failed to get pending post count' };
  }
}
