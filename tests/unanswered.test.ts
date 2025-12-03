import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getUnansweredQuestions, getUnansweredCount, isQuestionUnanswered } from '@/app/actions/unanswered';
import * as fc from 'fast-check';

describe('Unanswered Questions Feature', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.vote.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.profile.deleteMany({});
  });

  describe('Property 45: Unanswered filter accuracy', () => {
    it('should return only questions with zero answers', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-unanswered',
          pseudonym: 'TestAuthorUnanswered',
          reputation: 0,
        },
      });

      // Create unanswered question
      const unansweredQuestion = await prisma.question.create({
        data: {
          title: 'Unanswered Question',
          content: 'No answers yet',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create answered question
      const answeredQuestion = await prisma.question.create({
        data: {
          title: 'Answered Question',
          content: 'Has answers',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      await prisma.answer.create({
        data: {
          content: 'An answer',
          status: 'APPROVED',
          questionId: answeredQuestion.id,
          authorId: author.id,
        },
      });

      // Fetch unanswered questions
      const unanswered = await getUnansweredQuestions();

      expect(unanswered).toHaveLength(1);
      expect(unanswered[0].id).toBe(unansweredQuestion.id);
    });

    /**
     * Feature: smvitm-tech-forum, Property 45: Unanswered filter accuracy
     * Validates: Requirements 16.1
     */
    it('for any set of questions, unanswered filter should return only those with zero answers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 0, max: 5 }),
          async (numUnanswered, numAnswered) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            // Create unanswered questions
            const unansweredIds: string[] = [];
            for (let i = 0; i < numUnanswered; i++) {
              const question = await prisma.question.create({
                data: {
                  title: `Unanswered Question ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  authorId: author.id,
                },
              });
              unansweredIds.push(question.id);
            }

            // Create answered questions
            for (let i = 0; i < numAnswered; i++) {
              const question = await prisma.question.create({
                data: {
                  title: `Answered Question ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  authorId: author.id,
                },
              });

              await prisma.answer.create({
                data: {
                  content: `Answer ${i}`,
                  status: 'APPROVED',
                  questionId: question.id,
                  authorId: author.id,
                },
              });
            }

            // Fetch unanswered questions
            const result = await getUnansweredQuestions();

            // Should return exactly the unanswered questions
            expect(result.length).toBe(numUnanswered);

            // All returned questions should have zero answers
            for (const question of result) {
              const answerCount = await prisma.answer.count({
                where: { questionId: question.id },
              });
              expect(answerCount).toBe(0);
            }

            // Should return the correct question IDs
            const resultIds = result.map((q) => q.id).sort();
            expect(resultIds).toEqual(unansweredIds.sort());
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 46: Unanswered sort order', () => {
    it('should sort unanswered questions by most recent first', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-sort',
          pseudonym: 'TestAuthorSort',
          reputation: 0,
        },
      });

      // Create questions at different times
      const oldQuestion = await prisma.question.create({
        data: {
          title: 'Old Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
      });

      const newQuestion = await prisma.question.create({
        data: {
          title: 'New Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Fetch unanswered questions
      const questions = await getUnansweredQuestions();

      expect(questions).toHaveLength(2);
      // Most recent should be first
      expect(questions[0].id).toBe(newQuestion.id);
      expect(questions[1].id).toBe(oldQuestion.id);
    });

    /**
     * Feature: smvitm-tech-forum, Property 46: Unanswered sort order
     * Validates: Requirements 16.2
     */
    it('for any set of unanswered questions, they should be sorted by creation date descending', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          async (numQuestions) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            // Create questions with different timestamps
            const questions = [];
            for (let i = 0; i < numQuestions; i++) {
              const createdAt = new Date(Date.now() - i * 60 * 1000); // Each 1 minute apart
              const question = await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  authorId: author.id,
                  createdAt,
                },
              });
              questions.push(question);
            }

            // Fetch unanswered questions
            const result = await getUnansweredQuestions();

            expect(result.length).toBe(numQuestions);

            // Verify sorted by most recent first
            for (let i = 1; i < result.length; i++) {
              expect(result[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
                result[i].createdAt.getTime()
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 47: Dynamic unanswered list updates', () => {
    it('should remove question from unanswered list when answer is added', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-dynamic',
          pseudonym: 'TestAuthorDynamic',
          reputation: 0,
        },
      });

      // Create unanswered question
      const question = await prisma.question.create({
        data: {
          title: 'Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Verify it's in unanswered list
      let unanswered = await getUnansweredQuestions();
      expect(unanswered).toHaveLength(1);
      expect(unanswered[0].id).toBe(question.id);

      // Add an answer
      await prisma.answer.create({
        data: {
          content: 'An answer',
          status: 'APPROVED',
          questionId: question.id,
          authorId: author.id,
        },
      });

      // Verify it's no longer in unanswered list
      unanswered = await getUnansweredQuestions();
      expect(unanswered).toHaveLength(0);
    });

    /**
     * Feature: smvitm-tech-forum, Property 47: Dynamic unanswered list updates
     * Validates: Requirements 16.3
     */
    it('for any question, adding its first answer should remove it from unanswered list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (numQuestions) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            // Create unanswered questions
            const questions = [];
            for (let i = 0; i < numQuestions; i++) {
              const question = await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  authorId: author.id,
                },
              });
              questions.push(question);
            }

            // Verify all are unanswered
            let unanswered = await getUnansweredQuestions();
            expect(unanswered.length).toBe(numQuestions);

            // Add answer to first question
            await prisma.answer.create({
              data: {
                content: 'An answer',
                status: 'APPROVED',
                questionId: questions[0].id,
                authorId: author.id,
              },
            });

            // Verify count decreased by 1
            unanswered = await getUnansweredQuestions();
            expect(unanswered.length).toBe(numQuestions - 1);

            // Verify the answered question is not in the list
            const unansweredIds = unanswered.map((q) => q.id);
            expect(unansweredIds).not.toContain(questions[0].id);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 48: Unanswered status filter', () => {
    it('should only include approved questions in unanswered list', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-status',
          pseudonym: 'TestAuthorStatus',
          reputation: 0,
        },
      });

      // Create questions with different statuses
      const approvedQuestion = await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Rejected Question',
          content: 'Content',
          status: 'REJECTED',
          authorId: author.id,
        },
      });

      // Fetch unanswered questions
      const unanswered = await getUnansweredQuestions();

      expect(unanswered).toHaveLength(1);
      expect(unanswered[0].id).toBe(approvedQuestion.id);
      expect(unanswered[0].status).toBe('APPROVED');
    });

    /**
     * Feature: smvitm-tech-forum, Property 48: Unanswered status filter
     * Validates: Requirements 16.4
     */
    it('for any unanswered questions, all should have APPROVED status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 0, max: 3 }),
          async (numApproved, numPending, numRejected) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            // Create approved questions
            for (let i = 0; i < numApproved; i++) {
              await prisma.question.create({
                data: {
                  title: `Approved Question ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  authorId: author.id,
                },
              });
            }

            // Create pending questions
            for (let i = 0; i < numPending; i++) {
              await prisma.question.create({
                data: {
                  title: `Pending Question ${i}`,
                  content: `Content ${i}`,
                  status: 'PENDING',
                  authorId: author.id,
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
                  authorId: author.id,
                },
              });
            }

            // Fetch unanswered questions
            const result = await getUnansweredQuestions();

            // Should only return approved questions
            expect(result.length).toBe(numApproved);

            // All should have APPROVED status
            result.forEach((question) => {
              expect(question.status).toBe('APPROVED');
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 49: Unanswered count accuracy', () => {
    it('should return accurate count of unanswered questions', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-count',
          pseudonym: 'TestAuthorCount',
          reputation: 0,
        },
      });

      // Create unanswered questions
      await prisma.question.create({
        data: {
          title: 'Unanswered 1',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Unanswered 2',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Create answered question
      const answeredQuestion = await prisma.question.create({
        data: {
          title: 'Answered',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      await prisma.answer.create({
        data: {
          content: 'Answer',
          status: 'APPROVED',
          questionId: answeredQuestion.id,
          authorId: author.id,
        },
      });

      // Get count
      const count = await getUnansweredCount();

      expect(count).toBe(2);
    });

    /**
     * Feature: smvitm-tech-forum, Property 49: Unanswered count accuracy
     * Validates: Requirements 16.5
     */
    it('for any set of questions, unanswered count should equal number with zero answers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          async (numUnanswered, numAnswered) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            // Create unanswered questions
            for (let i = 0; i < numUnanswered; i++) {
              await prisma.question.create({
                data: {
                  title: `Unanswered ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  authorId: author.id,
                },
              });
            }

            // Create answered questions
            for (let i = 0; i < numAnswered; i++) {
              const question = await prisma.question.create({
                data: {
                  title: `Answered ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  authorId: author.id,
                },
              });

              await prisma.answer.create({
                data: {
                  content: `Answer ${i}`,
                  status: 'APPROVED',
                  questionId: question.id,
                  authorId: author.id,
                },
              });
            }

            // Get count
            const count = await getUnansweredCount();

            // Should equal number of unanswered questions
            expect(count).toBe(numUnanswered);

            // Verify by fetching the list
            const unansweredList = await getUnansweredQuestions(1, 100);
            expect(unansweredList.length).toBe(count);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
