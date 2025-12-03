import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAllTags, getQuestionsByTag, getTagByName, getPopularTags } from '@/app/actions/tags';
import * as fc from 'fast-check';
import { cleanupDatabase, createTestProfile, createTestQuestion } from './helpers/test-utils';

describe('Tag System', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Property 36: Tag page display', () => {
    it('should display all tags with question counts', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-tags',
          pseudonym: 'TestAuthorTags',
          reputation: 0,
        },
      });

      // Create tags
      const tag1 = await prisma.tag.create({
        data: { name: 'javascript' },
      });

      const tag2 = await prisma.tag.create({
        data: { name: 'typescript' },
      });

      const tag3 = await prisma.tag.create({
        data: { name: 'react' },
      });

      // Create questions with tags
      await prisma.question.create({
        data: {
          title: 'Question 1',
          content: 'Content 1',
          status: 'APPROVED',
          authorId: author.id,
          tags: {
            connect: [{ id: tag1.id }, { id: tag2.id }],
          },
        },
      });

      await prisma.question.create({
        data: {
          title: 'Question 2',
          content: 'Content 2',
          status: 'APPROVED',
          authorId: author.id,
          tags: {
            connect: [{ id: tag1.id }],
          },
        },
      });

      // Create a pending question (should not count)
      await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Pending content',
          status: 'PENDING',
          authorId: author.id,
          tags: {
            connect: [{ id: tag3.id }],
          },
        },
      });

      // Fetch all tags
      const tags = await getAllTags();

      expect(tags).toHaveLength(3);

      // Verify question counts
      const jsTag = tags.find((t) => t.name === 'javascript');
      const tsTag = tags.find((t) => t.name === 'typescript');
      const reactTag = tags.find((t) => t.name === 'react');

      expect(jsTag?.questionCount).toBe(2);
      expect(tsTag?.questionCount).toBe(1);
      expect(reactTag?.questionCount).toBe(0); // Pending question doesn't count
    });

    /**
     * Feature: smvitm-tech-forum, Property 36: Tag page display
     * Validates: Requirements 12.4
     */
    it('for any set of tags, all unique tags should be displayed with question counts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 2, maxLength: 15 }), {
            minLength: 1,
            maxLength: 10,
          }),
          fc.integer({ min: 0, max: 5 }),
          async (tagNames, questionsPerTag) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.tag.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            // Create unique tags
            const uniqueTagNames = [...new Set(tagNames.map((t) => t.toLowerCase()))];
            const tags = [];

            for (const tagName of uniqueTagNames) {
              const tag = await prisma.tag.create({
                data: { name: tagName },
              });
              tags.push(tag);

              // Create approved questions for this tag
              for (let i = 0; i < questionsPerTag; i++) {
                await prisma.question.create({
                  data: {
                    title: `Question ${i} for ${tagName}`,
                    content: `Content ${i}`,
                    status: 'APPROVED',
                    authorId: author.id,
                    tags: {
                      connect: [{ id: tag.id }],
                    },
                  },
                });
              }
            }

            // Fetch all tags
            const result = await getAllTags();

            // Should return all unique tags
            expect(result.length).toBe(uniqueTagNames.length);

            // Each tag should have correct question count
            result.forEach((tag) => {
              expect(tag.questionCount).toBe(questionsPerTag);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should only count approved questions', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-approved',
          pseudonym: 'TestAuthorApproved',
          reputation: 0,
        },
      });

      // Create a tag
      const tag = await prisma.tag.create({
        data: { name: 'test-tag' },
      });

      // Create questions with different statuses
      await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
          tags: { connect: [{ id: tag.id }] },
        },
      });

      await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
          tags: { connect: [{ id: tag.id }] },
        },
      });

      await prisma.question.create({
        data: {
          title: 'Rejected Question',
          content: 'Content',
          status: 'REJECTED',
          authorId: author.id,
          tags: { connect: [{ id: tag.id }] },
        },
      });

      // Fetch tags
      const tags = await getAllTags();

      const testTag = tags.find((t) => t.name === 'test-tag');
      expect(testTag?.questionCount).toBe(1); // Only approved question
    });
  });

  describe('Property 37: Tag-based filtering', () => {
    it('should return only questions with specified tag', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-filter',
          pseudonym: 'TestAuthorFilter',
          reputation: 0,
        },
      });

      // Create tags
      const jsTag = await prisma.tag.create({
        data: { name: 'javascript' },
      });

      const pyTag = await prisma.tag.create({
        data: { name: 'python' },
      });

      // Create questions
      const jsQuestion = await prisma.question.create({
        data: {
          title: 'JavaScript Question',
          content: 'JS content',
          status: 'APPROVED',
          authorId: author.id,
          tags: { connect: [{ id: jsTag.id }] },
        },
      });

      const pyQuestion = await prisma.question.create({
        data: {
          title: 'Python Question',
          content: 'Python content',
          status: 'APPROVED',
          authorId: author.id,
          tags: { connect: [{ id: pyTag.id }] },
        },
      });

      // Filter by JavaScript tag
      const jsQuestions = await getQuestionsByTag('javascript');

      expect(jsQuestions).toHaveLength(1);
      expect(jsQuestions[0].id).toBe(jsQuestion.id);
      expect(jsQuestions[0].tags.some((t) => t.name === 'javascript')).toBe(true);
    });

    /**
     * Feature: smvitm-tech-forum, Property 37: Tag-based filtering
     * Validates: Requirements 12.5
     */
    it('for any tag, filtering should return only questions with that tag', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 2, maxLength: 15 }), {
            minLength: 2,
            maxLength: 5,
          }),
          fc.integer({ min: 1, max: 5 }),
          async (tagNames, questionsPerTag) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.tag.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create an author profile
            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}${Math.random()}`,
                reputation: 0,
              },
            });

            // Create unique tags
            const uniqueTagNames = [...new Set(tagNames.map((t) => t.toLowerCase()))];
            if (uniqueTagNames.length < 2) return; // Need at least 2 tags

            const tags = [];
            for (const tagName of uniqueTagNames) {
              const tag = await prisma.tag.create({
                data: { name: tagName },
              });
              tags.push(tag);
            }

            // Create questions for each tag
            const questionsByTag = new Map<string, string[]>();

            for (const tag of tags) {
              const questionIds: string[] = [];

              for (let i = 0; i < questionsPerTag; i++) {
                const question = await prisma.question.create({
                  data: {
                    title: `Question ${i} for ${tag.name}`,
                    content: `Content ${i}`,
                    status: 'APPROVED',
                    authorId: author.id,
                    tags: { connect: [{ id: tag.id }] },
                  },
                });
                questionIds.push(question.id);
              }

              questionsByTag.set(tag.name, questionIds);
            }

            // Test filtering for each tag
            for (const tag of tags) {
              const filteredQuestions = await getQuestionsByTag(tag.name);

              // Should return correct number of questions
              expect(filteredQuestions.length).toBe(questionsPerTag);

              // All returned questions should have the specified tag
              filteredQuestions.forEach((q) => {
                expect(q.tags.some((t) => t.name === tag.name)).toBe(true);
              });

              // Should return the correct question IDs
              const expectedIds = questionsByTag.get(tag.name) || [];
              const actualIds = filteredQuestions.map((q) => q.id);
              expect(actualIds.sort()).toEqual(expectedIds.sort());
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should only return approved questions when filtering by tag', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-filter-status',
          pseudonym: 'TestAuthorFilterStatus',
          reputation: 0,
        },
      });

      // Create a tag
      const tag = await prisma.tag.create({
        data: { name: 'test-tag' },
      });

      // Create questions with different statuses
      const approvedQuestion = await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
          tags: { connect: [{ id: tag.id }] },
        },
      });

      await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Content',
          status: 'PENDING',
          authorId: author.id,
          tags: { connect: [{ id: tag.id }] },
        },
      });

      await prisma.question.create({
        data: {
          title: 'Rejected Question',
          content: 'Content',
          status: 'REJECTED',
          authorId: author.id,
          tags: { connect: [{ id: tag.id }] },
        },
      });

      // Filter by tag
      const questions = await getQuestionsByTag('test-tag');

      expect(questions).toHaveLength(1);
      expect(questions[0].id).toBe(approvedQuestion.id);
      expect(questions[0].status).toBe('APPROVED');
    });

    it('should return questions sorted by most recent', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-sort',
          pseudonym: 'TestAuthorSort',
          reputation: 0,
        },
      });

      // Create a tag
      const tag = await prisma.tag.create({
        data: { name: 'test-tag' },
      });

      // Create questions at different times
      const oldQuestion = await prisma.question.create({
        data: {
          title: 'Old Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          tags: { connect: [{ id: tag.id }] },
        },
      });

      const newQuestion = await prisma.question.create({
        data: {
          title: 'New Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
          tags: { connect: [{ id: tag.id }] },
        },
      });

      // Filter by tag
      const questions = await getQuestionsByTag('test-tag');

      expect(questions).toHaveLength(2);
      // Most recent should be first
      expect(questions[0].id).toBe(newQuestion.id);
      expect(questions[1].id).toBe(oldQuestion.id);
    });
  });

  describe('Tag utilities', () => {
    it('should get tag by name', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-get-tag',
          pseudonym: 'TestAuthorGetTag',
          reputation: 0,
        },
      });

      // Create a tag with questions
      const tag = await prisma.tag.create({
        data: { name: 'javascript' },
      });

      await prisma.question.create({
        data: {
          title: 'Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
          tags: { connect: [{ id: tag.id }] },
        },
      });

      // Get tag by name
      const result = await getTagByName('javascript');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('javascript');
      expect(result?.questionCount).toBe(1);
    });

    it('should return null for non-existent tag', async () => {
      const result = await getTagByName('non-existent-tag');
      expect(result).toBeNull();
    });

    it('should get popular tags sorted by question count', async () => {
      // Create an author profile
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-popular',
          pseudonym: 'TestAuthorPopular',
          reputation: 0,
        },
      });

      // Create tags with different question counts
      const tag1 = await prisma.tag.create({
        data: { name: 'popular-tag' },
      });

      const tag2 = await prisma.tag.create({
        data: { name: 'less-popular-tag' },
      });

      const tag3 = await prisma.tag.create({
        data: { name: 'unpopular-tag' },
      });

      // Create questions
      for (let i = 0; i < 5; i++) {
        await prisma.question.create({
          data: {
            title: `Question ${i}`,
            content: 'Content',
            status: 'APPROVED',
            authorId: author.id,
            tags: { connect: [{ id: tag1.id }] },
          },
        });
      }

      for (let i = 0; i < 3; i++) {
        await prisma.question.create({
          data: {
            title: `Question ${i}`,
            content: 'Content',
            status: 'APPROVED',
            authorId: author.id,
            tags: { connect: [{ id: tag2.id }] },
          },
        });
      }

      await prisma.question.create({
        data: {
          title: 'Question',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
          tags: { connect: [{ id: tag3.id }] },
        },
      });

      // Get popular tags
      const popularTags = await getPopularTags(3);

      expect(popularTags).toHaveLength(3);
      expect(popularTags[0].name).toBe('popular-tag');
      expect(popularTags[0].questionCount).toBe(5);
      expect(popularTags[1].name).toBe('less-popular-tag');
      expect(popularTags[1].questionCount).toBe(3);
      expect(popularTags[2].name).toBe('unpopular-tag');
      expect(popularTags[2].questionCount).toBe(1);
    });
  });
});
