import { prisma } from './prisma';

/**
 * Reputation changes:
 * - Question upvote: +5
 * - Answer upvote: +10
 * - Any downvote: -2
 * - Answer accepted: +15
 */

export async function updateReputation(
  profileId: string,
  change: number
): Promise<void> {
  await prisma.profile.update({
    where: { id: profileId },
    data: {
      reputation: {
        increment: change,
      },
    },
  });
}

export const REPUTATION_CHANGES = {
  QUESTION_UPVOTE: 5,
  ANSWER_UPVOTE: 10,
  DOWNVOTE: -2,
  ANSWER_ACCEPTED: 15,
} as const;
