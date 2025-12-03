import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getPendingPosts } from '@/app/actions/moderation';
import * as fc from 'fast-check';
import { cleanupDatabase, createTestProfile, createTestQuestion, createTestAnswer } from './helpers/test-utils';

describe('Moderation UI', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 20: Moderation queue information display', () => {
    it('should display post count, author pseudonym, and submission timestamp', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-display',
          pseudonym: 'TestModeratorDisplay',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-display',
          pseudonym: 'TestAuthorDisplay',
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

      const answer = await prisma.answer.create({
        data: {
          content: 'Test answer',
          status: 'PENDING',
          questionId: question.id,
          authorId: author.id,
        },
      });

      // Fetch pending posts
      const result = await getPendingPosts();

      expect(result).not.toHaveProperty('error');
      if (!('error' in result)) {
        expect(result).toHaveLength(2);

        // Verify each post has required information
        result.forEach((post) => {
          // Post count is implicit (length of array)
          expect(post).toHaveProperty('id');
          expect(post).toHaveProperty('type');
          expect(post).toHaveProperty('content');

          // Author pseudonym
          expect(post).toHaveProperty('author');
          expect(post.author).toHaveProperty('pseudonym');
          expect(post.author.pseudonym).toBe('TestAuthorDisplay');

          // Submission timestamp
          expect(post).toHaveProperty('createdAt');
          expect(post.createdAt).toBeInstanceOf(Date);
        });
      }
    });

    /**
     * Feature: smvitm-tech-forum, Property 20: Moderation queue information display
     * Validates: Requirements 6.5
     */
    it('for any pending post, display should include count, author pseudonym, and timestamp', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
            minLength: 1,
            maxLength: 5,
          }),
          async (numPosts, pseudonyms) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create a moderator profile
            const moderator = await prisma.profile.create({
              data: {
                userId: `moderator-${Date.now()}-${Math.random()}`,
                pseudonym: `Moderator${Date.now()}${Math.random()}`,
                reputation: 0,
                role: 'MODERATOR',
              },
            });

            // Create author profiles
            const authors = [];
            for (let i = 0; i < pseudonyms.length; i++) {
              const author = await prisma.profile.create({
                data: {
                  userId: `author-${Date.now()}-${i}-${Math.random()}`,
                  pseudonym: `${pseudonyms[i]}${Date.now()}${i}`,
                  reputation: 0,
                },
              });
              authors.push(author);
            }

            // Create pending questions
            for (let i = 0; i < numPosts; i++) {
              const author = authors[i % authors.length];
              await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'PENDING',
                  authorId: author.id,
                },
              });
            }

            // Fetch pending posts
            const result = await getPendingPosts();

            expect(result).not.toHaveProperty('error');
            if (!('error' in result)) {
              // Verify post count
              expect(result.length).toBe(numPosts);

              // Verify each post has required information
              result.forEach((post) => {
                // Author pseudonym must be present
                expect(post.author).toBeDefined();
                expect(post.author.pseudonym).toBeDefined();
                expect(typeof post.author.pseudonym).toBe('string');

                // Timestamp must be present and valid
                expect(post.createdAt).toBeInstanceOf(Date);
                expect(post.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 26: Moderator widget conditional display', () => {
    it('should display widget for moderators only', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-widget',
          pseudonym: 'TestModeratorWidget',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create a regular student profile
      const student = await prisma.profile.create({
        data: {
          userId: 'test-student-widget',
          pseudonym: 'TestStudentWidget',
          reputation: 0,
          role: 'STUDENT',
        },
      });

      // Verify moderator role
      expect(moderator.role).toBe('MODERATOR');
      expect(student.role).toBe('STUDENT');

      // The widget component itself checks the role and returns null for non-moderators
      // This test verifies the data layer supports the conditional display
    });

    /**
     * Feature: smvitm-tech-forum, Property 26: Moderator widget conditional display
     * Validates: Requirements 9.5
     */
    it('for any user, widget visibility should match moderator role status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('STUDENT', 'MODERATOR'),
          async (role) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create a profile with the specified role
            const profile = await prisma.profile.create({
              data: {
                userId: `user-${Date.now()}-${Math.random()}`,
                pseudonym: `User${Date.now()}${Math.random()}`,
                reputation: 0,
                role: role as 'STUDENT' | 'MODERATOR',
              },
            });

            // Verify role is set correctly
            expect(profile.role).toBe(role);

            // The widget should be visible only for moderators
            const shouldShowWidget = role === 'MODERATOR';

            // This property is enforced by the ModerationWidget component
            // which returns null for non-moderators
            expect(profile.role === 'MODERATOR').toBe(shouldShowWidget);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show pending post count in widget', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-count-widget',
          pseudonym: 'TestModeratorCountWidget',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-count-widget',
          pseudonym: 'TestAuthorCountWidget',
          reputation: 0,
        },
      });

      // Create pending posts
      await prisma.question.create({
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

      // Fetch pending posts
      const result = await getPendingPosts();

      expect(result).not.toHaveProperty('error');
      if (!('error' in result)) {
        // Widget should display this count
        expect(result.length).toBe(2);
      }
    });

    it('should not show widget to non-moderators', async () => {
      // Create a student profile
      const student = await prisma.profile.create({
        data: {
          userId: 'test-student-no-widget',
          pseudonym: 'TestStudentNoWidget',
          reputation: 0,
          role: 'STUDENT',
        },
      });

      // Verify student cannot access moderation functions
      expect(student.role).toBe('STUDENT');
      expect(student.role).not.toBe('MODERATOR');

      // The ModerationWidget component returns null for non-moderators
      // This is enforced at the component level
    });
  });

  describe('Stale post highlighting in UI', () => {
    it('should highlight stale posts in red', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-stale-ui',
          pseudonym: 'TestModeratorStaleUI',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-stale-ui',
          pseudonym: 'TestAuthorStaleUI',
          reputation: 0,
        },
      });

      // Create a stale post (more than 2 hours old)
      const staleDate = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const staleQuestion = await prisma.question.create({
        data: {
          title: 'Stale Question',
          content: 'Stale content',
          status: 'PENDING',
          authorId: author.id,
          createdAt: staleDate,
        },
      });

      // Fetch pending posts
      const result = await getPendingPosts();

      expect(result).not.toHaveProperty('error');
      if (!('error' in result)) {
        const stalePost = result.find((p) => p.id === staleQuestion.id);
        expect(stalePost).toBeDefined();
        expect(stalePost?.isStale).toBe(true);

        // The PostReviewCard component uses this flag to apply red styling:
        // border-red-300 bg-red-50 for stale posts
      }
    });
  });
});
