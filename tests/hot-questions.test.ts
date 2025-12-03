import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getHotQuestions } from '@/app/actions/hot-questions';
import { calculateHotScore, rankQuestionsByHotScore } from '@/lib/hot-questions';
import * as fc from 'fast-check';
import { cleanupDatabase, createTestProfile, createTestQuestion, createTestAnswer, uniqueId } from './helpers/test-utils';

describe('Hot Questions', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Hot score calculation', () => {
    it('should calculate hot score based on views, votes, answers, and recency', () => {
      const now = new Date();

      // Recent question (< 24 hours)
      const recentScore = calculateHotScore(100, 10, 5, now);
      // views * 0.1 + votes * 2 + answers * 5 + recency_bonus
      // 100 * 0.1 + 10 * 2 + 5 * 5 + 10 = 10 + 20 + 25 + 10 = 65
      expect(recentScore).toBe(65);

      // Older question (> 48 hours)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const oldScore = calculateHotScore(100, 10, 5, threeDaysAgo);
      // Same but no recency bonus
      // 100 * 0.1 + 10 * 2 + 5 * 5 + 0 = 10 + 20 + 25 + 0 = 55
      expect(oldScore).toBe(55);
    });

    it('should give recency bonus for questions < 24 hours old', () => {
      const now = new Date();
      const score = calculateHotScore(0, 0, 0, now);
      expect(score).toBe(10); // Only recency bonus
    });

    it('should give smaller recency bonus for questions 24-48 hours old', () => {
      const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const score = calculateHotScore(0, 0, 0, oneDayAgo);
      expect(score).toBe(5); // Smaller recency bonus
    });

    it('should give no recency bonus for questions > 48 hours old', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const score = calculateHotScore(0, 0, 0, threeDaysAgo);
      expect(score).toBe(0); // No recency bonus
    });
  });

  describe('Property 40: Hot questions ranking', () => {
    it('should rank questions by hot score', () => {
      const now = new Date();
      const questions = [
        {
          id: '1',
          title: 'Low activity',
          views: 10,
          voteScore: 1,
          answerCount: 0,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          title: 'High activity',
          views: 200,
          voteScore: 20,
          answerCount: 10,
          createdAt: now,
        },
        {
          id: '3',
          title: 'Medium activity',
          views: 50,
          voteScore: 5,
          answerCount: 2,
          createdAt: now,
        },
      ];

      const ranked = rankQuestionsByHotScore(questions);

      expect(ranked).toHaveLength(3);
      expect(ranked[0].id).toBe('2'); // Highest score
      expect(ranked[1].id).toBe('3'); // Medium score
      expect(ranked[2].id).toBe('1'); // Lowest score

      // Verify scores are in descending order
      expect(ranked[0].hotScore).toBeGreaterThan(ranked[1].hotScore);
      expect(ranked[1].hotScore).toBeGreaterThan(ranked[2].hotScore);
    });

    /**
     * Feature: smvitm-tech-forum, Property 40: Hot questions ranking
     * Validates: Requirements 14.2
     */
    it('for any set of questions, ranking should order by hot score descending', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              views: fc.integer({ min: 0, max: 100 }),
              voteScore: fc.integer({ min: -5, max: 10 }),
              answerCount: fc.integer({ min: 0, max: 5 }),
              ageInHours: fc.integer({ min: 0, max: 168 }), // 0-7 days
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (questionData) => {
            // Clean up for this iteration
            await cleanupDatabase();

            // Create an author
            const author = await prisma.profile.create({
              data: {
                userId: uniqueId('author'),
                pseudonym: uniqueId('Author'),
                reputation: 0,
              },
            });

            // Create questions
            const questions = [];
            for (let i = 0; i < questionData.length; i++) {
              const data = questionData[i];
              const createdAt = new Date(Date.now() - data.ageInHours * 60 * 60 * 1000);

              const question = await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  views: data.views,
                  authorId: author.id,
                  createdAt,
                },
              });

              // Create votes (simplified - just create the net vote)
              if (data.voteScore !== 0) {
                const voter = await prisma.profile.create({
                  data: {
                    userId: uniqueId(`voter-${i}`),
                    pseudonym: uniqueId(`Voter${i}`),
                    reputation: 0,
                  },
                });

                // Create a single vote with the total value (for testing purposes)
                await prisma.vote.create({
                  data: {
                    value: data.voteScore > 0 ? 1 : -1,
                    profileId: voter.id,
                    questionId: question.id,
                  },
                });
              }

              // Create answers (simplified)
              for (let j = 0; j < Math.min(data.answerCount, 2); j++) {
                await prisma.answer.create({
                  data: {
                    content: `Answer ${j}`,
                    status: 'APPROVED',
                    questionId: question.id,
                    authorId: author.id,
                  },
                });
              }

              questions.push({
                id: question.id,
                title: question.title,
                views: data.views,
                voteScore: data.voteScore,
                answerCount: Math.min(data.answerCount, 2),
                createdAt,
              });
            }

            // Rank questions
            const ranked = rankQuestionsByHotScore(questions);

            // Verify sorted by hot score descending
            for (let i = 1; i < ranked.length; i++) {
              expect(ranked[i - 1].hotScore).toBeGreaterThanOrEqual(
                ranked[i].hotScore
              );
            }
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property 41: Hot questions status filter', () => {
    it('should only include approved questions in hot list', async () => {
      // Create an author
      const author = await prisma.profile.create({
        data: {
          userId: uniqueId('author'),
          pseudonym: uniqueId('TestAuthorHot'),
          reputation: 0,
        },
      });

      // Create questions with different statuses
      const approvedQuestion = await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Content',
          status: 'APPROVED',
          views: 100,
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Content',
          status: 'PENDING',
          views: 200, // Higher views but pending
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Rejected Question',
          content: 'Content',
          status: 'REJECTED',
          views: 150,
          authorId: author.id,
        },
      });

      // Fetch hot questions
      const hotQuestions = await getHotQuestions();

      expect(hotQuestions).toHaveLength(1);
      expect(hotQuestions[0].id).toBe(approvedQuestion.id);
    });

    /**
     * Feature: smvitm-tech-forum, Property 41: Hot questions status filter
     * Validates: Requirements 14.5
     */
    it('for any hot questions list, all should have APPROVED status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          fc.integer({ min: 0, max: 2 }),
          fc.integer({ min: 0, max: 2 }),
          async (numApproved, numPending, numRejected) => {
            // Clean up for this iteration
            await cleanupDatabase();

            // Create an author
            const author = await prisma.profile.create({
              data: {
                userId: uniqueId('author'),
                pseudonym: uniqueId('Author'),
                reputation: 0,
              },
            });

            // Create approved questions (with recent timestamp)
            const approvedIds: string[] = [];
            for (let i = 0; i < numApproved; i++) {
              const q = await prisma.question.create({
                data: {
                  title: `Approved Question ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  views: 100 + i,
                  authorId: author.id,
                  createdAt: new Date(), // Ensure recent timestamp
                },
              });
              approvedIds.push(q.id);
            }

            // Create pending questions
            for (let i = 0; i < numPending; i++) {
              await prisma.question.create({
                data: {
                  title: `Pending Question ${i}`,
                  content: `Content ${i}`,
                  status: 'PENDING',
                  views: 200 + i,
                  authorId: author.id,
                  createdAt: new Date(),
                },
              });
            }

            // Create rejected questions
            for (let i = 0; i < numRejected; i++) {
              await prisma.question.create({
                data: {
                  title: `Rejected Question ${i}`,
                  content: `Content ${i}`,
                  status: 'REJECTED',
                  views: 150 + i,
                  authorId: author.id,
                  createdAt: new Date(),
                },
              });
            }

            // Fetch hot questions
            const hotQuestions = await getHotQuestions(10);

            // Should only return approved questions
            expect(hotQuestions.length).toBe(numApproved);

            // Verify all returned questions are approved ones
            hotQuestions.forEach((q) => {
              expect(approvedIds).toContain(q.id);
            });
          }
        ),
        { numRuns: 3 }
      );
    });
  });
});
