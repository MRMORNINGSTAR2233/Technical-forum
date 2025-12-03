import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { updateReputation, REPUTATION_CHANGES } from '@/lib/reputation';
import { cleanupDatabase, createTestProfile } from './helpers/test-utils';

describe('Reputation System', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 15: Reputation updates on voting', () => {
    /**
     * Feature: smvitm-tech-forum, Property 15: Reputation updates on voting
     * Validates: Requirements 5.5, 17.1, 17.2, 17.3, 17.4, 17.5
     */
    it('should increase reputation by 5 for question upvote', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-1',
          pseudonym: 'TestUser1',
          reputation: 0,
        },
      });

      await updateReputation(profile.id, REPUTATION_CHANGES.QUESTION_UPVOTE);

      const updated = await prisma.profile.findUnique({
        where: { id: profile.id },
      });

      expect(updated?.reputation).toBe(5);
    });

    it('should increase reputation by 10 for answer upvote', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-2',
          pseudonym: 'TestUser2',
          reputation: 0,
        },
      });

      await updateReputation(profile.id, REPUTATION_CHANGES.ANSWER_UPVOTE);

      const updated = await prisma.profile.findUnique({
        where: { id: profile.id },
      });

      expect(updated?.reputation).toBe(10);
    });

    it('should decrease reputation by 2 for downvote', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-3',
          pseudonym: 'TestUser3',
          reputation: 10,
        },
      });

      await updateReputation(profile.id, REPUTATION_CHANGES.DOWNVOTE);

      const updated = await prisma.profile.findUnique({
        where: { id: profile.id },
      });

      expect(updated?.reputation).toBe(8);
    });

    it('should increase reputation by 15 for accepted answer', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-4',
          pseudonym: 'TestUser4',
          reputation: 0,
        },
      });

      await updateReputation(profile.id, REPUTATION_CHANGES.ANSWER_ACCEPTED);

      const updated = await prisma.profile.findUnique({
        where: { id: profile.id },
      });

      expect(updated?.reputation).toBe(15);
    });

    it('should update reputation immediately', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-5',
          pseudonym: 'TestUser5',
          reputation: 100,
        },
      });

      // Multiple updates should be immediate
      await updateReputation(profile.id, 5);
      await updateReputation(profile.id, 10);
      await updateReputation(profile.id, -2);

      const updated = await prisma.profile.findUnique({
        where: { id: profile.id },
      });

      // 100 + 5 + 10 - 2 = 113
      expect(updated?.reputation).toBe(113);
    });
  });
});
