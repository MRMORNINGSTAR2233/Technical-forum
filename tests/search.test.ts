import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { searchQuestions } from '@/app/actions/search';
import * as fc from 'fast-check';

describe('Search Functionality', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.vote.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.profile.deleteMany({});
  });

  describe('Property 53: Search term matching', () => {
    it('should match questions by title', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-search',
          pseudonym: 'TestAuthor',
          reputation: 0,
        },
      });

      await prisma.question.create({
        data: {
          title: 'JavaScript Array Methods',
          content: 'How to use map and filter?',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      const results = await searchQuestions('JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('JavaScript');
    });

    it('should match questions by content', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-content',
          pseudonym: 'TestAuthor',
          reputation: 0,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Programming Question',
          content: 'How to use TypeScript interfaces?',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      const results = await searchQuestions('TypeScript');
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('TypeScript');
    });

    /**
     * Feature: smvitm-tech-forum, Property 53: Search term matching
     * Validates: Requirements 20.1
     */
    it('for any search term, results should match title or content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 10 }),
          async (searchTerm) => {
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.tag.deleteMany({});
            await prisma.profile.deleteMany({});

            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}`,
                reputation: 0,
              },
            });

            // Create matching question
            await prisma.question.create({
              data: {
                title: `Question about ${searchTerm}`,
                content: `Content with ${searchTerm}`,
                status: 'APPROVED',
                authorId: author.id,
              },
            });

            // Create non-matching question
            await prisma.question.create({
              data: {
                title: 'Different Question',
                content: 'Different content',
                status: 'APPROVED',
                authorId: author.id,
              },
            });

            const results = await searchQuestions(searchTerm);
            
            // All results should match the search term
            results.forEach((result) => {
              const matchesTitle = result.title.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesContent = result.content.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTags = result.tags.some((tag) =>
                tag.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
              
              expect(matchesTitle || matchesContent || matchesTags).toBe(true);
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 54: Search relevance ranking', () => {
    it('should rank exact title matches higher', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-relevance',
          pseudonym: 'TestAuthor',
          reputation: 0,
        },
      });

      await prisma.question.create({
        data: {
          title: 'React',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Introduction to React',
          content: 'Content',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      const results = await searchQuestions('React');
      expect(results[0].title).toBe('React'); // Exact match first
    });

    /**
     * Feature: smvitm-tech-forum, Property 54: Search relevance ranking
     * Validates: Requirements 20.2
     */
    it('for any search results, they should be ordered by relevance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 4, maxLength: 8 }),
          async (term) => {
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}`,
                reputation: 0,
              },
            });

            // Create questions with different relevance
            await prisma.question.create({
              data: {
                title: term, // Exact match
                content: 'Content',
                status: 'APPROVED',
                authorId: author.id,
              },
            });

            await prisma.question.create({
              data: {
                title: `About ${term}`, // Contains term
                content: 'Content',
                status: 'APPROVED',
                authorId: author.id,
              },
            });

            const results = await searchQuestions(term);
            
            // Verify sorted by relevance descending
            for (let i = 1; i < results.length; i++) {
              expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(
                results[i].relevanceScore
              );
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 55: Search status filter', () => {
    it('should only return approved questions', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-status',
          pseudonym: 'TestAuthor',
          reputation: 0,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Approved Question',
          content: 'Search term',
          status: 'APPROVED',
          authorId: author.id,
        },
      });

      await prisma.question.create({
        data: {
          title: 'Pending Question',
          content: 'Search term',
          status: 'PENDING',
          authorId: author.id,
        },
      });

      const results = await searchQuestions('Search term');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Approved Question');
    });

    /**
     * Feature: smvitm-tech-forum, Property 55: Search status filter
     * Validates: Requirements 20.3
     */
    it('for any search results, all should have APPROVED status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 10 }),
          async (term) => {
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}`,
                reputation: 0,
              },
            });

            // Create questions with different statuses
            await prisma.question.create({
              data: {
                title: `Approved ${term}`,
                content: 'Content',
                status: 'APPROVED',
                authorId: author.id,
              },
            });

            await prisma.question.create({
              data: {
                title: `Pending ${term}`,
                content: 'Content',
                status: 'PENDING',
                authorId: author.id,
              },
            });

            const results = await searchQuestions(term);
            
            // Verify all results are approved
            const allApproved = await prisma.question.findMany({
              where: { status: 'APPROVED' },
              select: { id: true },
            });
            const approvedIds = allApproved.map((q) => q.id);

            results.forEach((result) => {
              expect(approvedIds).toContain(result.id);
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 56: Tag-based search inclusion', () => {
    it('should match questions by tags', async () => {
      const author = await prisma.profile.create({
        data: {
          userId: 'test-author-tags',
          pseudonym: 'TestAuthor',
          reputation: 0,
        },
      });

      const tag = await prisma.tag.create({
        data: { name: 'javascript' },
      });

      await prisma.question.create({
        data: {
          title: 'Programming Question',
          content: 'How to code?',
          status: 'APPROVED',
          authorId: author.id,
          tags: {
            connect: [{ id: tag.id }],
          },
        },
      });

      const results = await searchQuestions('javascript');
      expect(results).toHaveLength(1);
      expect(results[0].tags.some((t) => t.name === 'javascript')).toBe(true);
    });

    /**
     * Feature: smvitm-tech-forum, Property 56: Tag-based search inclusion
     * Validates: Requirements 20.4
     */
    it('for any tag search, results should include questions with matching tags', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 10 }),
          async (tagName) => {
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.tag.deleteMany({});
            await prisma.profile.deleteMany({});

            const author = await prisma.profile.create({
              data: {
                userId: `author-${Date.now()}-${Math.random()}`,
                pseudonym: `Author${Date.now()}`,
                reputation: 0,
              },
            });

            const tag = await prisma.tag.create({
              data: { name: tagName.toLowerCase() },
            });

            await prisma.question.create({
              data: {
                title: 'Question with tag',
                content: 'Content',
                status: 'APPROVED',
                authorId: author.id,
                tags: {
                  connect: [{ id: tag.id }],
                },
              },
            });

            const results = await searchQuestions(tagName);
            
            // Should find the question with matching tag
            expect(results.length).toBeGreaterThan(0);
            
            // At least one result should have the matching tag
            const hasMatchingTag = results.some((result) =>
              result.tags.some((t) =>
                t.name.toLowerCase().includes(tagName.toLowerCase())
              )
            );
            expect(hasMatchingTag).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
