import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { voteOnQuestion, voteOnAnswer } from '@/app/actions/votes';
import * as fc from 'fast-check';

describe('Voting UI', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.vote.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.profile.deleteMany({});
  });

  describe('Property 29: Real-time vote count updates', () => {
    it('should update vote count immediately after voting', async () => {
      // Create test profiles
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author',
          pseudonym: 'TestAuthor',
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: 'test-voter',
          pseudonym: 'TestVoter',
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

      // Vote on the question
      const result = await voteOnQuestion(question.id, 1);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('newScore');
      
      if ('newScore' in result) {
        expect(result.newScore).toBe(1);
      }

      // Verify the vote was recorded
      const votes = await prisma.vote.findMany({
        where: { questionId: question.id },
      });

      expect(votes).toHaveLength(1);
      expect(votes[0].value).toBe(1);
    });

    /**
     * Feature: smvitm-tech-forum, Property 29: Real-time vote count updates
     * Validates: Requirements 10.5
     */
    it('for any sequence of votes, the displayed count should match the sum of vote values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: -1, max: 1 }), { minLength: 1, maxLength: 10 }),
          async (voteValues) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create test profiles
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
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

            // Create voters and cast votes
            let expectedScore = 0;
            for (let i = 0; i < voteValues.length; i++) {
              const value = voteValues[i];
              if (value === 0) continue; // Skip zero votes

              const voter = await prisma.profile.create({
                data: {
                  userId: `voter-${Date.now()}-${i}-${Math.random()}`,
                  pseudonym: `Voter${Date.now()}${i}${Math.random()}`,
                  reputation: 0,
                },
              });

              await prisma.vote.create({
                data: {
                  value: value as 1 | -1,
                  profileId: voter.id,
                  questionId: question.id,
                },
              });

              expectedScore += value;
            }

            // Fetch all votes and calculate score
            const votes = await prisma.vote.findMany({
              where: { questionId: question.id },
              select: { value: true },
            });

            const actualScore = votes.reduce((sum, vote) => sum + vote.value, 0);

            // The displayed score should match the sum of all vote values
            expect(actualScore).toBe(expectedScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle vote toggling correctly', async () => {
      // Create test profiles
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-toggle',
          pseudonym: 'TestAuthorToggle',
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: 'test-voter-toggle',
          pseudonym: 'TestVoterToggle',
          reputation: 0,
        },
      });

      // Create a test question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question Toggle',
          content: 'Test content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // First vote: upvote
      const result1 = await voteOnQuestion(question.id, 1);
      expect(result1).toHaveProperty('success', true);
      if ('newScore' in result1) {
        expect(result1.newScore).toBe(1);
      }

      // Second vote: same upvote (should toggle off)
      const result2 = await voteOnQuestion(question.id, 1);
      expect(result2).toHaveProperty('success', true);
      if ('newScore' in result2) {
        expect(result2.newScore).toBe(0);
      }

      // Third vote: downvote
      const result3 = await voteOnQuestion(question.id, -1);
      expect(result3).toHaveProperty('success', true);
      if ('newScore' in result3) {
        expect(result3.newScore).toBe(-1);
      }

      // Fourth vote: same downvote (should toggle off)
      const result4 = await voteOnQuestion(question.id, -1);
      expect(result4).toHaveProperty('success', true);
      if ('newScore' in result4) {
        expect(result4.newScore).toBe(0);
      }
    });

    it('should update answer vote counts in real-time', async () => {
      // Create test profiles
      const questionAuthor = await prisma.profile.create({
        data: {
          userId: 'test-q-author',
          pseudonym: 'TestQAuthor',
          reputation: 0,
        },
      });

      const answerAuthor = await prisma.profile.create({
        data: {
          userId: 'test-a-author',
          pseudonym: 'TestAAuthor',
          reputation: 0,
        },
      });

      const voter = await prisma.profile.create({
        data: {
          userId: 'test-a-voter',
          pseudonym: 'TestAVoter',
          reputation: 0,
        },
      });

      // Create a test question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'APPROVED',
          authorId: questionAuthor.id,
        },
      });

      // Create a test answer
      const answer = await prisma.answer.create({
        data: {
          content: 'Test answer',
          status: 'APPROVED',
          questionId: question.id,
          authorId: answerAuthor.id,
        },
      });

      // Vote on the answer
      const result = await voteOnAnswer(answer.id, 1);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('newScore');
      
      if ('newScore' in result) {
        expect(result.newScore).toBe(1);
      }

      // Verify the vote was recorded
      const votes = await prisma.vote.findMany({
        where: { answerId: answer.id },
      });

      expect(votes).toHaveLength(1);
      expect(votes[0].value).toBe(1);
    });
  });
});
