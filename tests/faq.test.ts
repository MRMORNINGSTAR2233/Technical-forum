import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getRecentFAQs, getFAQCount } from '@/app/actions/faq';
import * as fc from 'fast-check';
import { cleanupDatabase, createTestProfile, createTestQuestion, createTestAnswer } from './helpers/test-utils';

describe('AI FAQ System', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 24: AI summarization for eligible questions', () => {
    it('should identify eligible questions for FAQ generation', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-faq',
          pseudonym: 'TestAuthor',
          reputation: 0,
        },
      });

      // Create eligible question (approved, has answer with positive votes)
      const eligibleQuestion = await prisma.question.create({
        data: {
          title: 'Eligible Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
          createdAt: new Date(), // Recent
        },
      });

      const answer = await prisma.answer.create({
        data: {
          content: 'Good answer',
          status: 'APPROVED',
          questionId: eligibleQuestion.id,
          authorId: author.id,
        },
      });

      // Add positive vote
      await prisma.vote.create({
        data: {
          value: 1,
          profileId: author.id,
          answerId: answer.id,
        },
      });

      // Verify question is eligible
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const eligible = await prisma.question.findMany({
        where: {
          status: 'APPROVED',
          createdAt: { gte: twentyFourHoursAgo },
          answers: {
            some: {
              status: 'APPROVED',
              votes: {
                some: { value: { gt: 0 } },
              },
            },
          },
        },
      });

      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(eligibleQuestion.id);
    });

    /**
     * Feature: smvitm-tech-forum, Property 24: AI summarization for eligible questions
     * Validates: Requirements 8.2
     */
    it(
      'for any question, eligibility should match criteria',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              status: fc.constantFrom('APPROVED', 'PENDING', 'REJECTED'),
              hasAnswer: fc.boolean(),
              answerHasPositiveVotes: fc.boolean(),
              ageInHours: fc.integer({ min: 0, max: 48 }),
            }),
            async (data) => {
              const author = await prisma.profile.create({
                data: {
                  userId: `author-${Date.now()}-${Math.random()}`,
                  pseudonym: `Author${Date.now()}${Math.random()}`,
                  reputation: 0,
                },
              });

              const createdAt = new Date(Date.now() - data.ageInHours * 60 * 60 * 1000);
              const question = await prisma.question.create({
                data: {
                  title: 'Test Question',
                  content: 'Content',
                  status: data.status as any,
                  authorId: author.id,
                  createdAt,
                },
              });

              if (data.hasAnswer) {
                const answer = await prisma.answer.create({
                  data: {
                    content: 'Answer',
                    status: 'APPROVED',
                    questionId: question.id,
                    authorId: author.id,
                  },
                });

                if (data.answerHasPositiveVotes) {
                  await prisma.vote.create({
                    data: {
                      value: 1,
                      profileId: author.id,
                      answerId: answer.id,
                    },
                  });
                }
              }

              // Check eligibility
              const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              const eligible = await prisma.question.findMany({
                where: {
                  status: 'APPROVED',
                  createdAt: { gte: twentyFourHoursAgo },
                  answers: {
                    some: {
                      status: 'APPROVED',
                      votes: {
                        some: { value: { gt: 0 } },
                      },
                    },
                  },
                },
              });

              // Should be eligible only if all criteria met
              const shouldBeEligible =
                data.status === 'APPROVED' &&
                data.hasAnswer &&
                data.answerHasPositiveVotes &&
                data.ageInHours < 24;

              if (shouldBeEligible) {
                expect(eligible.length).toBeGreaterThan(0);
              } else {
                expect(eligible.some((q) => q.id === question.id)).toBe(false);
              }
            }
          ),
          { numRuns: 10 }
        );
      },
      30000
    );
  });

  describe('Property 25: FAQ storage with source reference', () => {
    it('should store FAQ with source question reference', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-storage',
          pseudonym: 'TestAuthor',
          reputation: 0,
        },
      });

      const question = await prisma.question.create({
        data: {
          title: 'Source Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      // Store FAQ
      const faq = await prisma.aI_FAQ.create({
        data: {
          topic: 'javascript, arrays',
          question: 'How to use array methods?',
          answer: 'Use map, filter, reduce...',
          sourceQuestionId: question.id,
        },
      });

      expect(faq.sourceQuestionId).toBe(question.id);

      // Verify can retrieve source question
      const storedFAQ = await prisma.aI_FAQ.findUnique({
        where: { id: faq.id },
      });

      expect(storedFAQ?.sourceQuestionId).toBe(question.id);
    });

    /**
     * Feature: smvitm-tech-forum, Property 25: FAQ storage with source reference
     * Validates: Requirements 8.4
     */
    it(
      'for any FAQ, source question reference should be preserved',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 10, maxLength: 100 }),
            fc.string({ minLength: 20, maxLength: 200 }),
            async (faqQuestion, faqAnswer) => {
              const author = await prisma.profile.create({
                data: {
                  userId: `author-${Date.now()}-${Math.random()}`,
                  pseudonym: `Author${Date.now()}${Math.random()}`,
                  reputation: 0,
                },
              });

              const question = await prisma.question.create({
                data: {
                  title: 'Source Question',
                  content: 'Content',
                  status: 'APPROVED',
                  authorId: author.id,
                },
              });

              // Store FAQ with source reference
              const faq = await prisma.aI_FAQ.create({
                data: {
                  topic: 'test',
                  question: faqQuestion,
                  answer: faqAnswer,
                  sourceQuestionId: question.id,
                },
              });

              // Retrieve and verify
              const retrieved = await prisma.aI_FAQ.findUnique({
                where: { id: faq.id },
              });

              expect(retrieved).not.toBeNull();
              expect(retrieved?.sourceQuestionId).toBe(question.id);
              expect(retrieved?.question).toBe(faqQuestion);
              expect(retrieved?.answer).toBe(faqAnswer);
            }
          ),
          { numRuns: 10 }
        );
      },
      30000
    );
  });

  describe('Property 23: Eligible question selection', () => {
    /**
     * Feature: smvitm-tech-forum, Property 23: Eligible question selection
     * Validates: Requirements 8.1
     */
    it(
      'for any time period, only questions from last 24h with positive votes should be eligible',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 0, max: 48 }),
            async (hoursAgo) => {
              const author = await prisma.profile.create({
                data: {
                  userId: `author-${Date.now()}-${Math.random()}`,
                  pseudonym: `Author${Date.now()}${Math.random()}`,
                  reputation: 0,
                },
              });

              const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
              const question = await prisma.question.create({
                data: {
                  title: 'Test Question',
                  content: 'Content',
                  status: 'APPROVED',
                  authorId: author.id,
                  createdAt,
                },
              });

              const answer = await prisma.answer.create({
                data: {
                  content: 'Answer',
                  status: 'APPROVED',
                  questionId: question.id,
                  authorId: author.id,
                },
              });

              await prisma.vote.create({
                data: {
                  value: 1,
                  profileId: author.id,
                  answerId: answer.id,
                },
              });

              // Check eligibility
              const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              const eligible = await prisma.question.findMany({
                where: {
                  status: 'APPROVED',
                  createdAt: { gte: twentyFourHoursAgo },
                  answers: {
                    some: {
                      status: 'APPROVED',
                      votes: {
                        some: { value: { gt: 0 } },
                      },
                    },
                  },
                },
              });

              // Should be eligible only if < 24 hours old
              if (hoursAgo < 24) {
                expect(eligible.some((q) => q.id === question.id)).toBe(true);
              } else {
                expect(eligible.some((q) => q.id === question.id)).toBe(false);
              }
            }
          ),
          { numRuns: 10 }
        );
      },
      30000
    );
  });

  describe('FAQ retrieval', () => {
    it('should fetch recent FAQs', async () => {
      // Create FAQs
      await prisma.aI_FAQ.create({
        data: {
          topic: 'test',
          question: 'Question 1',
          answer: 'Answer 1',
        },
      });

      await prisma.aI_FAQ.create({
        data: {
          topic: 'test',
          question: 'Question 2',
          answer: 'Answer 2',
        },
      });

      const faqs = await getRecentFAQs(5);
      expect(faqs).toHaveLength(2);
    });

    it('should get FAQ count', async () => {
      await prisma.aI_FAQ.create({
        data: {
          topic: 'test',
          question: 'Question',
          answer: 'Answer',
        },
      });

      const count = await getFAQCount();
      expect(count).toBe(1);
    });
  });
});
