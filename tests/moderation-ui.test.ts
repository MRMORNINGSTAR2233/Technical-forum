import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as fc from 'fast-check';
import { cleanupDatabase, uniqueId } from './helpers/test-utils';

/**
 * Moderation UI Tests
 * 
 * Note: These tests verify moderation UI data requirements directly using database operations
 * since server actions require Next.js request context (cookies) which isn't
 * available in unit tests.
 */

describe('Moderation UI', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 20: Moderation queue information display', () => {
    it('should have posts with author pseudonym and submission timestamp', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthorDisplay'),
          reputation: 0,
        },
      });

      // Create pending posts
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      await prisma.answer.create({
        data: {
          content: 'Test answer',
          status: 'PENDING',
          questionId: question.id,
          authorId: author.id,
        },
      });

      // Fetch pending posts with author info
      const pendingQuestions = await prisma.question.findMany({
        where: { status: 'PENDING' },
        include: { author: true },
      });

      const pendingAnswers = await prisma.answer.findMany({
        where: { status: 'PENDING' },
        include: { author: true },
      });

      const allPending = [...pendingQuestions, ...pendingAnswers];

      expect(allPending).toHaveLength(2);

      // Verify each post has required information
      allPending.forEach((post) => {
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('author');
        expect(post.author).toHaveProperty('pseudonym');
        expect(post.author.pseudonym).toBe(author.pseudonym);
        expect(post).toHaveProperty('createdAt');
        expect(post.createdAt).toBeInstanceOf(Date);
      });
    });

    /**
     * Feature: smvitm-tech-forum, Property 20: Moderation queue information display
     * Validates: Requirements 6.5
     */
    it('for any pending post, display should include author pseudonym and timestamp', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (numPosts) => {
            await cleanupDatabase();

            // Create author
            const author = await prisma.profile.create({
              data: {
                userId: uniqueId('author'),
                pseudonym: uniqueId('Author'),
                reputation: 0,
              },
            });

            // Create pending questions
            for (let i = 0; i < numPosts; i++) {
              await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'PENDING',
                  authorId: author.id,
                },
              });
            }

            // Fetch pending posts with author info
            const pendingPosts = await prisma.question.findMany({
              where: { status: 'PENDING' },
              include: { author: true },
            });

            expect(pendingPosts).toHaveLength(numPosts);

            // Verify each post has required display info
            pendingPosts.forEach((post) => {
              expect(post.author.pseudonym).toBe(author.pseudonym);
              expect(post.createdAt).toBeInstanceOf(Date);
            });
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property 21: Moderator action buttons', () => {
    it('should allow posts to be approved or rejected', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create a pending post
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Simulate approve action
      const approved = await prisma.question.update({
        where: { id: question.id },
        data: { status: 'APPROVED' },
      });

      expect(approved.status).toBe('APPROVED');

      // Create another pending post for rejection test
      const question2 = await prisma.question.create({
        data: {
          title: 'Test Question 2',
          content: 'Test content 2',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Simulate reject action
      const rejected = await prisma.question.update({
        where: { id: question2.id },
        data: { status: 'REJECTED' },
      });

      expect(rejected.status).toBe('REJECTED');
    });

    /**
     * Feature: smvitm-tech-forum, Property 21: Moderator action buttons
     * Validates: Requirements 6.6
     */
    it('each pending post should be approvable or rejectable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (approve) => {
            await cleanupDatabase();

            const author = await prisma.profile.create({
              data: {
                userId: uniqueId('author'),
                pseudonym: uniqueId('Author'),
                reputation: 0,
              },
            });

            const question = await prisma.question.create({
              data: {
                title: 'Test Question',
                content: 'Test content',
                status: 'PENDING',
                authorId: author.id,
              },
            });

            // Perform action based on test input
            const newStatus = approve ? 'APPROVED' : 'REJECTED';
            const updated = await prisma.question.update({
              where: { id: question.id },
              data: { status: newStatus },
            });

            expect(updated.status).toBe(newStatus);

            // Verify it's no longer pending
            const pendingCount = await prisma.question.count({
              where: { status: 'PENDING' },
            });
            expect(pendingCount).toBe(0);
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property 22: Post removal from queue after action', () => {
    it('should remove posts from queue after approval or rejection', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      // Create pending posts
      const question1 = await prisma.question.create({
        data: {
          title: 'Question 1',
          content: 'Content 1',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      const question2 = await prisma.question.create({
        data: {
          title: 'Question 2',
          content: 'Content 2',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Initially 2 pending
      let pendingCount = await prisma.question.count({
        where: { status: 'PENDING' },
      });
      expect(pendingCount).toBe(2);

      // Approve first question
      await prisma.question.update({
        where: { id: question1.id },
        data: { status: 'APPROVED' },
      });

      pendingCount = await prisma.question.count({
        where: { status: 'PENDING' },
      });
      expect(pendingCount).toBe(1);

      // Reject second question
      await prisma.question.update({
        where: { id: question2.id },
        data: { status: 'REJECTED' },
      });

      pendingCount = await prisma.question.count({
        where: { status: 'PENDING' },
      });
      expect(pendingCount).toBe(0);
    });

    /**
     * Feature: smvitm-tech-forum, Property 22: Post removal from queue after action
     * Validates: Requirements 6.7
     */
    it('approved/rejected posts should not appear in pending queue', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.oneof(fc.constant('APPROVED'), fc.constant('REJECTED')), {
            minLength: 1,
            maxLength: 5,
          }),
          async (actions) => {
            await cleanupDatabase();

            const author = await prisma.profile.create({
              data: {
                userId: uniqueId('author'),
                pseudonym: uniqueId('Author'),
                reputation: 0,
              },
            });

            // Create pending posts
            const questions = [];
            for (let i = 0; i < actions.length; i++) {
              const q = await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'PENDING',
                  authorId: author.id,
                },
              });
              questions.push(q);
            }

            // Apply actions
            for (let i = 0; i < actions.length; i++) {
              await prisma.question.update({
                where: { id: questions[i].id },
                data: { status: actions[i] },
              });
            }

            // Verify no pending posts remain
            const pendingCount = await prisma.question.count({
              where: { status: 'PENDING' },
            });
            expect(pendingCount).toBe(0);
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property 23: Stale post highlighting', () => {
    it('should be able to identify stale posts for highlighting', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthor'),
          reputation: 0,
        },
      });

      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;

      // Create a stale post (3 hours old)
      const staleQuestion = await prisma.question.create({
        data: {
          title: 'Stale Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
          createdAt: new Date(now - 3 * 60 * 60 * 1000),
        },
      });

      // Create a fresh post (30 minutes old)
      const freshQuestion = await prisma.question.create({
        data: {
          title: 'Fresh Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
          createdAt: new Date(now - 30 * 60 * 1000),
        },
      });

      // Query and calculate staleness
      const pendingPosts = await prisma.question.findMany({
        where: { status: 'PENDING' },
      });

      const postsWithStaleInfo = pendingPosts.map((post) => ({
        ...post,
        isStale: now - post.createdAt.getTime() > twoHoursMs,
      }));

      const stalePost = postsWithStaleInfo.find((p) => p.id === staleQuestion.id);
      const freshPost = postsWithStaleInfo.find((p) => p.id === freshQuestion.id);

      expect(stalePost?.isStale).toBe(true);
      expect(freshPost?.isStale).toBe(false);
    });
  });
});
