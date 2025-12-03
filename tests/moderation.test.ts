import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getPendingPosts, approvePost, rejectPost, getPendingPostCount } from '@/app/actions/moderation';
import * as fc from 'fast-check';
import { cleanupDatabase, createTestProfile, createTestQuestion, createTestAnswer } from './helpers/test-utils';

describe('Moderation System', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 16: Pending posts in moderation queue', () => {
    it('should return all pending questions and answers', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator',
          pseudonym: 'TestModerator',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author',
          pseudonym: 'TestAuthor',
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

      const question2 = await prisma.question.create({
        data: {
          title: 'Pending Question 2',
          content: 'Content 2',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Create an approved question (should not appear)
      await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Approved content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create a pending answer
      const answer1 = await prisma.answer.create({
        data: {
          content: 'Pending answer',
          status: 'PENDING',
          questionId: question1.id,
          authorId: author.id,
        },
      });

      // Fetch pending posts
      const result = await getPendingPosts();

      expect(result).not.toHaveProperty('error');
      if (!('error' in result)) {
        expect(result).toHaveLength(3); // 2 questions + 1 answer
        
        // Verify all posts are pending
        const questionPosts = result.filter((p) => p.type === 'question');
        const answerPosts = result.filter((p) => p.type === 'answer');
        
        expect(questionPosts).toHaveLength(2);
        expect(answerPosts).toHaveLength(1);
        
        // Verify posts are sorted by creation date
        for (let i = 1; i < result.length; i++) {
          expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            result[i - 1].createdAt.getTime()
          );
        }
      }
    });

    /**
     * Feature: smvitm-tech-forum, Property 16: Pending posts in moderation queue
     * Validates: Requirements 6.1
     */
    it('for any number of pending posts, all should appear in moderation queue', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          async (numQuestions, numAnswers) => {
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

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
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
            const result = await getPendingPosts();

            expect(result).not.toHaveProperty('error');
            if (!('error' in result)) {
              const expectedCount = questions.length > 0 ? numQuestions + numAnswers : numQuestions;
              expect(result).toHaveLength(expectedCount);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not return approved or rejected posts', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-2',
          pseudonym: 'TestModerator2',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-2',
          pseudonym: 'TestAuthor2',
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

      // Fetch pending posts
      const result = await getPendingPosts();

      expect(result).not.toHaveProperty('error');
      if (!('error' in result)) {
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Pending Question');
      }
    });
  });

  describe('Property 17: Approval changes status', () => {
    it('should change post status to APPROVED when approved', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-approve',
          pseudonym: 'TestModeratorApprove',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-approve',
          pseudonym: 'TestAuthorApprove',
          reputation: 0,
        },
      });

      // Create a pending question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Approve the question
      const result = await approvePost(question.id, 'question');

      expect(result).toHaveProperty('success', true);

      // Verify status changed
      const updatedQuestion = await prisma.question.findUnique({
        where: { id: question.id },
        select: { status: true },
      });

      expect(updatedQuestion?.status).toBe('APPROVED');
    });

    /**
     * Feature: smvitm-tech-forum, Property 17: Approval changes status
     * Validates: Requirements 6.2
     */
    it('for any pending post, approving it should change status to APPROVED', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('question', 'answer'),
          async (postType) => {
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

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            let postId: string;

            if (postType === 'question') {
              const question = await prisma.question.create({
                data: {
                  title: 'Test Question',
                  content: 'Test content',
                  status: 'PENDING',
                  authorId: author.id,
                },
              });
              postId = question.id;
            } else {
              // Create a question first for the answer
              const question = await prisma.question.create({
                data: {
                  title: 'Parent Question',
                  content: 'Parent content',
                  status: 'APPROVED',
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
              postId = answer.id;
            }

            // Approve the post
            const result = await approvePost(postId, postType);

            expect(result).toHaveProperty('success', true);

            // Verify status changed
            if (postType === 'question') {
              const updatedQuestion = await prisma.question.findUnique({
                where: { id: postId },
                select: { status: true },
              });
              expect(updatedQuestion?.status).toBe('APPROVED');
            } else {
              const updatedAnswer = await prisma.answer.findUnique({
                where: { id: postId },
                select: { status: true },
              });
              expect(updatedAnswer?.status).toBe('APPROVED');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 18: Rejection changes status', () => {
    it('should change post status to REJECTED when rejected', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-reject',
          pseudonym: 'TestModeratorReject',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-reject',
          pseudonym: 'TestAuthorReject',
          reputation: 0,
        },
      });

      // Create a pending question
      const question = await prisma.question.create({
        data: {
          title: 'Test Question',
          content: 'Test content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Reject the question
      const result = await rejectPost(question.id, 'question');

      expect(result).toHaveProperty('success', true);

      // Verify status changed
      const updatedQuestion = await prisma.question.findUnique({
        where: { id: question.id },
        select: { status: true },
      });

      expect(updatedQuestion?.status).toBe('REJECTED');
    });

    /**
     * Feature: smvitm-tech-forum, Property 18: Rejection changes status
     * Validates: Requirements 6.3
     */
    it('for any pending post, rejecting it should change status to REJECTED', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('question', 'answer'),
          async (postType) => {
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

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            let postId: string;

            if (postType === 'question') {
              const question = await prisma.question.create({
                data: {
                  title: 'Test Question',
                  content: 'Test content',
                  status: 'PENDING',
                  authorId: author.id,
                },
              });
              postId = question.id;
            } else {
              // Create a question first for the answer
              const question = await prisma.question.create({
                data: {
                  title: 'Parent Question',
                  content: 'Parent content',
                  status: 'APPROVED',
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
              postId = answer.id;
            }

            // Reject the post
            const result = await rejectPost(postId, postType);

            expect(result).toHaveProperty('success', true);

            // Verify status changed
            if (postType === 'question') {
              const updatedQuestion = await prisma.question.findUnique({
                where: { id: postId },
                select: { status: true },
              });
              expect(updatedQuestion?.status).toBe('REJECTED');
            } else {
              const updatedAnswer = await prisma.answer.findUnique({
                where: { id: postId },
                select: { status: true },
              });
              expect(updatedAnswer?.status).toBe('REJECTED');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 19: Stale post highlighting', () => {
    it('should mark posts older than 2 hours as stale', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-stale',
          pseudonym: 'TestModeratorStale',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-stale',
          pseudonym: 'TestAuthorStale',
          reputation: 0,
        },
      });

      // Create a recent pending question (not stale)
      const recentQuestion = await prisma.question.create({
        data: {
          title: 'Recent Question',
          content: 'Recent content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      // Create an old pending question (stale - more than 2 hours ago)
      const staleDate = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
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
        expect(result).toHaveLength(2);

        const recentPost = result.find((p) => p.id === recentQuestion.id);
        const stalePost = result.find((p) => p.id === staleQuestion.id);

        expect(recentPost?.isStale).toBe(false);
        expect(stalePost?.isStale).toBe(true);
      }
    });

    /**
     * Feature: smvitm-tech-forum, Property 19: Stale post highlighting
     * Validates: Requirements 6.4
     */
    it('for any post pending more than 2 hours, isStale should be true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }), // hours ago
          async (hoursAgo) => {
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

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            // Create a question with specific age
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

            // Fetch pending posts
            const result = await getPendingPosts();

            expect(result).not.toHaveProperty('error');
            if (!('error' in result)) {
              const post = result.find((p) => p.id === question.id);
              expect(post).toBeDefined();

              // Post should be stale if older than 2 hours
              const expectedStale = hoursAgo > 2;
              expect(post?.isStale).toBe(expectedStale);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Pending post count', () => {
    it('should return correct count of pending posts', async () => {
      // Create a moderator profile
      const moderator = await prisma.profile.create({
        data: {
          userId: 'test-moderator-count',
          pseudonym: 'TestModeratorCount',
          reputation: 0,
          role: 'MODERATOR',
        },
      });

      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-count',
          pseudonym: 'TestAuthorCount',
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

      // Get count
      const count = await getPendingPostCount();

      expect(count).toBe(2); // 1 question + 1 answer
    });
  });
});
