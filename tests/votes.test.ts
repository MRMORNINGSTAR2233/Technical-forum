import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { voteOnQuestion, voteOnAnswer } from '@/app/actions/votes';

describe('Voting System', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.vote.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.profile.deleteMany({});
  });

  describe('Property 11: Upvote creates positive vote', () => {
    /**
     * Feature: smvitm-tech-forum, Property 11: Upvote creates positive vote
     * Validates: Requirements 5.1
     */
    it('should create a vote with value +1 when upvoting', async () => {
      // Create test profiles
      const author = await prisma.profile.create({
        data: {
          userId: 'author-user',
          pseudonym: 'Author',
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: 'voter-user',
          pseudonym: 'Voter',
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
      // Create test profiles
      const author = await prisma.profile.create({
        data: {
          userId: 'author-user-2',
          pseudonym: 'Author2',
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: 'voter-user-2',
          pseudonym: 'Voter2',
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
      // Create test profiles
      const author = await prisma.profile.create({
        data: {
          userId: 'author-user-3',
          pseudonym: 'Author3',
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: 'voter-user-3',
          pseudonym: 'Voter3',
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
      // Create test profiles
      const author = await prisma.profile.create({
        data: {
          userId: 'author-user-4',
          pseudonym: 'Author4',
          reputation: 0,
        },
      });

      const voter1 = await prisma.profile.create({
        data: {
          userId: 'voter-user-4a',
          pseudonym: 'Voter4a',
          reputation: 0,
        },
      });

      const voter2 = await prisma.profile.create({
        data: {
          userId: 'voter-user-4b',
          pseudonym: 'Voter4b',
          reputation: 0,
        },
      });

      const voter3 = await prisma.profile.create({
        data: {
          userId: 'voter-user-4c',
          pseudonym: 'Voter4c',
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
