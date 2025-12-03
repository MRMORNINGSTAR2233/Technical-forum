import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { cleanupDatabase, uniqueId } from './helpers/test-utils';

describe('Voting System', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 11: Upvote creates positive vote', () => {
    /**
     * Feature: smvitm-tech-forum, Property 11: Upvote creates positive vote
     * Validates: Requirements 5.1
     */
    it('should create a vote with value +1 when upvoting', async () => {
      // Create test profiles with unique IDs
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('Author'),
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: uniqueId('voter'),
          pseudonym: uniqueId('Voter'),
          reputation: 0,
        },
      });

      // Create a question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create an upvote
      const vote = await prisma.vote.create({
        data: {
          value: 1,
          profileId: voter.id,
          questionId: question.id,
        },
      });

      expect(vote.value).toBe(1);
    });
  });

  describe('Property 12: Downvote creates negative vote', () => {
    /**
     * Feature: smvitm-tech-forum, Property 12: Downvote creates negative vote
     * Validates: Requirements 5.2
     */
    it('should create a vote with value -1 when downvoting', async () => {
      // Create test profiles with unique IDs
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('Author'),
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: uniqueId('voter'),
          pseudonym: uniqueId('Voter'),
          reputation: 0,
        },
      });

      // Create a question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create a downvote
      const vote = await prisma.vote.create({
        data: {
          value: -1,
          profileId: voter.id,
          questionId: question.id,
        },
      });

      expect(vote.value).toBe(-1);
    });
  });

  describe('Property 13: Vote uniqueness per user', () => {
    /**
     * Feature: smvitm-tech-forum, Property 13: Vote uniqueness per user
     * Validates: Requirements 5.3
     */
    it('should prevent duplicate votes from the same user', async () => {
      // Create test profiles with unique IDs
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('Author'),
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: uniqueId('voter'),
          pseudonym: uniqueId('Voter'),
          reputation: 0,
        },
      });

      // Create a question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create first vote
      await prisma.vote.create({
        data: {
          value: 1,
          profileId: voter.id,
          questionId: question.id,
        },
      });

      // Try to create duplicate vote - should fail due to unique constraint
      await expect(
        prisma.vote.create({
          data: {
            value: 1,
            profileId: voter.id,
            questionId: question.id,
          },
        })
      ).rejects.toThrow();

      // Verify only one vote exists
      const votes = await prisma.vote.findMany({
        where: {
          profileId: voter.id,
          questionId: question.id,
        },
      });

      expect(votes.length).toBe(1);
    });
  });

  describe('Property 14: Vote count calculation', () => {
    /**
     * Feature: smvitm-tech-forum, Property 14: Vote count calculation
     * Validates: Requirements 5.4
     */
    it('should calculate vote count as sum of all vote values', async () => {
      // Create test profiles with unique IDs
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('Author'),
          reputation: 0,
        },
      });

      const voter1 = await prisma.profile.create({
        data: {
          userId: uniqueId('voter1'),
          pseudonym: uniqueId('Voter1'),
          reputation: 0,
        },
      });

      const voter2 = await prisma.profile.create({
        data: {
          userId: uniqueId('voter2'),
          pseudonym: uniqueId('Voter2'),
          reputation: 0,
        },
      });

      const voter3 = await prisma.profile.create({
        data: {
          userId: uniqueId('voter3'),
          pseudonym: uniqueId('Voter3'),
          reputation: 0,
        },
      });

      // Create a question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create votes: +1, +1, -1
      await prisma.vote.create({
        data: {
          value: 1,
          profileId: voter1.id,
          questionId: question.id,
        },
      });

      await prisma.vote.create({
        data: {
          value: 1,
          profileId: voter2.id,
          questionId: question.id,
        },
      });

      await prisma.vote.create({
        data: {
          value: -1,
          profileId: voter3.id,
          questionId: question.id,
        },
      });

      // Calculate vote count
      const votes = await prisma.vote.findMany({
        where: { questionId: question.id },
        select: { value: true },
      });

      const voteCount = votes.reduce((sum, vote) => sum + vote.value, 0);

      // Expected: 1 + 1 + (-1) = 1
      expect(voteCount).toBe(1);
    });
  });
});
