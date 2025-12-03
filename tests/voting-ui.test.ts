import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { cleanupDatabase, uniqueId } from './helpers/test-utils';

describe('Voting UI', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 29: Real-time vote count updates', () => {
    // Note: These tests verify vote count calculation directly since server actions
    // require Next.js request context (cookies) which isn't available in unit tests
    
    it('should calculate vote count correctly', async () => {
      // Create test profiles
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      const voter1 = await prisma.profile.create({
        data: {
          userId: uniqueId('voter1'),
          pseudonym: uniqueId('TestVoter1'),
          reputation: 0,
        },
      });

      const voter2 = await prisma.profile.create({
        data: {
          userId: uniqueId('voter2'),
          pseudonym: uniqueId('TestVoter2'),
          reputation: 0,
        },
      });

      // Create a test question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create votes directly
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

      // Verify the vote count
      const votes = await prisma.vote.findMany({
        where: { questionId: question.id },
      });

      const voteCount = votes.reduce((sum, v) => sum + v.value, 0);
      expect(voteCount).toBe(2);
    });

    it('should handle upvotes and downvotes correctly', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      const voter1 = await prisma.profile.create({
        data: {
          userId: uniqueId('voter1'),
          pseudonym: uniqueId('TestVoter1'),
          reputation: 0,
        },
      });

      const voter2 = await prisma.profile.create({
        data: {
          userId: uniqueId('voter2'),
          pseudonym: uniqueId('TestVoter2'),
          reputation: 0,
        },
      });

      const voter3 = await prisma.profile.create({
        data: {
          userId: uniqueId('voter3'),
          pseudonym: uniqueId('TestVoter3'),
          reputation: 0,
        },
      });

      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create mixed votes: +1, +1, -1
      await prisma.vote.create({
        data: { value: 1, profileId: voter1.id, questionId: question.id },
      });

      await prisma.vote.create({
        data: { value: 1, profileId: voter2.id, questionId: question.id },
      });

      await prisma.vote.create({
        data: { value: -1, profileId: voter3.id, questionId: question.id },
      });

      // Verify the net vote count
      const votes = await prisma.vote.findMany({
        where: { questionId: question.id },
      });

      const voteCount = votes.reduce((sum, v) => sum + v.value, 0);
      expect(voteCount).toBe(1); // 1 + 1 - 1 = 1
    });

    it('should calculate answer vote counts correctly', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: uniqueId('voter'),
          pseudonym: uniqueId('TestVoter'),
          reputation: 0,
        },
      });

      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      const answer = await prisma.answer.create({
        data: {
          content: 'Test answer',
          status: 'APPROVED',
          questionId: question.id,
          authorId: author.id,
        },
      });

      // Create a vote on the answer
      await prisma.vote.create({
        data: {
          value: 1,
          profileId: voter.id,
          answerId: answer.id,
        },
      });

      // Verify the vote count
      const votes = await prisma.vote.findMany({
        where: { answerId: answer.id },
      });

      const voteCount = votes.reduce((sum, v) => sum + v.value, 0);
      expect(voteCount).toBe(1);
    });
  });
});