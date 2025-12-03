import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as fc from 'fast-check';
import { cleanupDatabase, uniqueId } from './helpers/test-utils';

/**
 * Moderation System Tests
 * 
 * Note: These tests verify moderation logic directly using database operations
 * since server actions require Next.js request context (cookies) which isn't
 * available in unit tests. Full integration tests with authentication should
 * be run separately in an E2E testing environment.
 */

describe('Moderation System', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 16: Pending posts in moderation queue', () => {
    it('should be able to query all pending questions and answers', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create pending questions
      const question1 = await prisma.question.create({
        data: {
          title: 'Pending Question 1',
          content: 'Content 1',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Pending Question 2',
          content: 'Content 2',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Create an approved question (should not appear in pending)
      await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Approved content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create a pending answer
      await prisma.answer.create({
        data: {
          content: 'Pending answer',
          status: 'PENDING',
          questionId: question1.id,
          authorId: author.id,
        },
      });

      // Fetch pending posts directly
      const pendingQuestions = await prisma.question.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });

      const pendingAnswers = await prisma.answer.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });

      expect(pendingQuestions).toHaveLength(2);
      expect(pendingAnswers).toHaveLength(1);
    });

    /**
     * Feature: smvitm-tech-forum, Property 16: Pending posts in moderation queue
     * Validates: Requirements 6.1
     */
    it('for any number of pending posts, all should be queryable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 0, max: 5 }),
          async (numQuestions, numAnswers) => {
            // Clean up for this iteration
            await cleanupDatabase();

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: uniqueId('author'),
                pseudonym: uniqueId('Author'),
                reputation: 0,
              },
            });

            // Create pending questions
            const questions = [];
            for (let i = 0; i < numQuestions; i++) {
              const question = await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'PENDING',
                  authorId: author.id,
                },
              });
              questions.push(question);
            }

            // Create pending answers (need at least one question)
            if (questions.length > 0) {
              for (let i = 0; i < numAnswers; i++) {
                await prisma.answer.create({
                  data: {
                    content: `Answer ${i}`,
                    status: 'PENDING',
                    questionId: questions[0].id,
                    authorId: author.id,
                  },
                });
              }
            }

            // Fetch pending posts
            const pendingQuestions = await prisma.question.findMany({
              where: { status: 'PENDING' },
            });

            const pendingAnswers = await prisma.answer.findMany({
              where: { status: 'PENDING' },
            });

            const totalPending = pendingQuestions.length + pendingAnswers.length;
            const expectedCount = questions.length > 0 ? numQuestions + numAnswers : numQuestions;
            expect(totalPending).toBe(expectedCount);
          }
        ),
        { numRuns: 3 }
      );
    });

    it('should not return approved or rejected posts in pending query', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create posts with different statuses
      await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Pending',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Approved',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Rejected Question',
          content: 'Rejected',
          status: 'REJECTED',
          authorId: author.id,
        },
      });

      // Fetch only pending posts
      const pendingQuestions = await prisma.question.findMany({
        where: { status: 'PENDING' },
      });

      expect(pendingQuestions).toHaveLength(1);
      expect(pendingQuestions[0].title).toBe('Pending Question');
    });
  });

  describe('Property 17: Post approval by moderators', () => {
    it('should update status to APPROVED when post is approved', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create a pending question
      const question = await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Approve the question directly
      const approvedQuestion = await prisma.question.update({
        where: { id: question.id },
        data: { status: 'APPROVED' },
      });

      expect(approvedQuestion.status).toBe('APPROVED');

      // Verify persistence
      const fetchedQuestion = await prisma.question.findUnique({
        where: { id: question.id },
      });

      expect(fetchedQuestion?.status).toBe('APPROVED');
    });

    /**
     * Feature: smvitm-tech-forum, Property 17: Post approval by moderators
     * Validates: Requirements 6.2
     */
    it('approved posts should become visible', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create a pending question
      const question = await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Initially pending - should not appear in approved posts
      const beforeApproval = await prisma.question.findMany({
        where: { status: 'APPROVED' },
      });
      expect(beforeApproval).toHaveLength(0);

      // Approve the question
      await prisma.question.update({
        where: { id: question.id },
        data: { status: 'APPROVED' },
      });

      // Now should appear in approved posts
      const afterApproval = await prisma.question.findMany({
        where: { status: 'APPROVED' },
      });
      expect(afterApproval).toHaveLength(1);
      expect(afterApproval[0].id).toBe(question.id);
    });
  });

  describe('Property 18: Post rejection by moderators', () => {
    it('should update status to REJECTED when post is rejected', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create a pending question
      const question = await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Inappropriate content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Reject the question with a reason
      const rejectedQuestion = await prisma.question.update({
        where: { id: question.id },
        data: {
          status: 'REJECTED',
        },
      });

      expect(rejectedQuestion.status).toBe('REJECTED');
    });

    /**
     * Feature: smvitm-tech-forum, Property 18: Post rejection by moderators
     * Validates: Requirements 6.3
     */
    it('rejected posts should not be visible to regular users', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create and reject a question
      const question = await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      await prisma.question.update({
        where: { id: question.id },
        data: { status: 'REJECTED' },
      });

      // Query for approved posts (what regular users see)
      const visiblePosts = await prisma.question.findMany({
        where: { status: 'APPROVED' },
      });

      expect(visiblePosts).toHaveLength(0);
    });
  });

  describe('Property 19: Moderation queue prioritization', () => {
    it('should order posts by creation date', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create questions with different timestamps
      const now = Date.now();
      
      const oldQuestion = await prisma.question.create({
        data: {
          title: 'Old Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
          createdAt: new Date(now - 3600000), // 1 hour ago
        },
      });

      const newQuestion = await prisma.question.create({
        data: {
          title: 'New Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
          createdAt: new Date(now),
        },
      });

      // Query with ordering (oldest first)
      const pendingPosts = await prisma.question.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });

      expect(pendingPosts).toHaveLength(2);
      expect(pendingPosts[0].id).toBe(oldQuestion.id);
      expect(pendingPosts[1].id).toBe(newQuestion.id);
    });

    /**
     * Feature: smvitm-tech-forum, Property 19: Moderation queue prioritization
     * Validates: Requirements 6.4
     */
    it('older posts should be prioritized', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 2, maxLength: 5 }),
          async (hoursAgoList) => {
            await cleanupDatabase();

            const author = await prisma.profile.create({
              data: {
                userId: uniqueId('author'),
                pseudonym: uniqueId('Author'),
                reputation: 0,
              },
            });

            const now = Date.now();
            
            // Create questions with different ages
            for (let i = 0; i < hoursAgoList.length; i++) {
              await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'PENDING',
                  authorId: author.id,
                  createdAt: new Date(now - hoursAgoList[i] * 3600000),
                },
              });
            }

            // Query with oldest first
            const pendingPosts = await prisma.question.findMany({
              where: { status: 'PENDING' },
              orderBy: { createdAt: 'asc' },
            });

            // Verify ordering
            for (let i = 1; i < pendingPosts.length; i++) {
              expect(pendingPosts[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                pendingPosts[i - 1].createdAt.getTime()
              );
            }
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property 20: Stale post identification', () => {
    it('should identify stale posts (older than 2 hours)', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;

      // Create a stale question (3 hours old)
      const staleQuestion = await prisma.question.create({
        data: {
          title: 'Stale Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
          createdAt: new Date(now - 3 * 60 * 60 * 1000),
        },
      });

      // Create a fresh question (30 minutes old)
      const freshQuestion = await prisma.question.create({
        data: {
          title: 'Fresh Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
          createdAt: new Date(now - 30 * 60 * 1000),
        },
      });

      // Query and check staleness
      const pendingPosts = await prisma.question.findMany({
        where: { status: 'PENDING' },
      });

      for (const post of pendingPosts) {
        const ageMs = now - post.createdAt.getTime();
        const isStale = ageMs > twoHoursMs;

        if (post.id === staleQuestion.id) {
          expect(isStale).toBe(true);
        } else if (post.id === freshQuestion.id) {
          expect(isStale).toBe(false);
        }
      }
    });

    /**
     * Feature: smvitm-tech-forum, Property 20: Stale post identification
     * Validates: Requirements 6.5
     */
    it('should correctly calculate stale status based on age', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 24 }),
          async (hoursAgo) => {
            await cleanupDatabase();

            const author = await prisma.profile.create({
              data: {
                userId: uniqueId('author'),
                pseudonym: uniqueId('Author'),
                reputation: 0,
              },
            });

            const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
            const question = await prisma.question.create({
              data: {
                title: 'Test Question',
                content: 'Test content',
                status: 'PENDING',
                authorId: author.id,
                createdAt,
              },
            });

            const fetchedQuestion = await prisma.question.findUnique({
              where: { id: question.id },
            });

            expect(fetchedQuestion).toBeDefined();

            // Check staleness calculation
            // Note: Using >= for boundary case since some ms pass during test execution
            const ageMs = Date.now() - fetchedQuestion!.createdAt.getTime();
            const isStale = ageMs > 2 * 60 * 60 * 1000;
            const expectedStale = hoursAgo >= 2; // Use >= to account for timing

            expect(isStale).toBe(expectedStale);
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Pending post count', () => {
    it('should return correct count of pending posts', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthorCount'),
          reputation: 0,
        },
      });

      // Create pending posts
      const question = await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      await prisma.answer.create({
        data: {
          content: 'Pending answer',
          status: 'PENDING',
          questionId: question.id,
          authorId: author.id,
        },
      });

      // Create approved post (should not count)
      await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Count pending posts directly
      const pendingQuestionCount = await prisma.question.count({
        where: { status: 'PENDING' },
      });

      const pendingAnswerCount = await prisma.answer.count({
        where: { status: 'PENDING' },
      });

      const totalPending = pendingQuestionCount + pendingAnswerCount;

      expect(totalPending).toBe(2); // 1 question + 1 answer
    });
  });
});
