import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getUsers, getUserByPseudonym, getUserCount, searchUsers } from '@/app/actions/users';
import * as fc from 'fast-check';

describe('User Directory', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.vote.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.profile.deleteMany({});
  });

  describe('Property 42: Users sorted by reputation', () => {
    it('should return users sorted by reputation in descending order', async () => {
      // Create users with different reputations
      await prisma.profile.create({
        data: {
          userId: 'user-1',
          pseudonym: 'LowRep',
          reputation: 10,
        },
      });

      await prisma.profile.create({
        data: {
          userId: 'user-2',
          pseudonym: 'HighRep',
          reputation: 100,
        },
      });

      await prisma.profile.create({
        data: {
          userId: 'user-3',
          pseudonym: 'MidRep',
          reputation: 50,
        },
      });

      // Fetch users
      const users = await getUsers();

      expect(users).toHaveLength(3);
      expect(users[0].pseudonym).toBe('HighRep');
      expect(users[0].reputation).toBe(100);
      expect(users[1].pseudonym).toBe('MidRep');
      expect(users[1].reputation).toBe(50);
      expect(users[2].pseudonym).toBe('LowRep');
      expect(users[2].reputation).toBe(10);
    });

    /**
     * Feature: smvitm-tech-forum, Property 42: Users sorted by reputation
     * Validates: Requirements 15.1
     */
    it('for any set of users, they should be sorted by reputation descending', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 0, max: 1000 }), {
            minLength: 2,
            maxLength: 10,
          }),
          async (reputations) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create users with specified reputations
            for (let i = 0; i < reputations.length; i++) {
              await prisma.profile.create({
                data: {
                  userId: `user-${Date.now()}-${i}-${Math.random()}`,
                  pseudonym: `User${Date.now()}${i}${Math.random()}`,
                  reputation: reputations[i],
                },
              });
            }

            // Fetch users
            const users = await getUsers(1, 100);

            expect(users.length).toBe(reputations.length);

            // Verify sorted by reputation descending
            for (let i = 1; i < users.length; i++) {
              expect(users[i - 1].reputation).toBeGreaterThanOrEqual(
                users[i].reputation
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 6: Profile privacy preservation', () => {
    it('should not include email in user profile responses', async () => {
      // Create a user
      await prisma.profile.create({
        data: {
          userId: 'user-email-test',
          pseudonym: 'TestUser',
          reputation: 50,
        },
      });

      // Fetch users
      const users = await getUsers();

      expect(users).toHaveLength(1);
      expect(users[0]).toHaveProperty('pseudonym');
      expect(users[0]).toHaveProperty('reputation');
      expect(users[0]).not.toHaveProperty('userId');
      expect(users[0]).not.toHaveProperty('email');
    });

    /**
     * Feature: smvitm-tech-forum, Property 6: Profile privacy preservation
     * Validates: Requirements 2.2, 15.2
     */
    it('for any user profile query, email should never be included', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
            minLength: 1,
            maxLength: 5,
          }),
          async (pseudonyms) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create users
            for (let i = 0; i < pseudonyms.length; i++) {
              await prisma.profile.create({
                data: {
                  userId: `user-${Date.now()}-${i}-${Math.random()}`,
                  pseudonym: `${pseudonyms[i]}${Date.now()}${i}`,
                  reputation: i * 10,
                },
              });
            }

            // Fetch users
            const users = await getUsers(1, 100);

            expect(users.length).toBe(pseudonyms.length);

            // Verify no email or userId in any response
            users.forEach((user) => {
              expect(user).not.toHaveProperty('userId');
              expect(user).not.toHaveProperty('email');
              expect(user).toHaveProperty('pseudonym');
              expect(user).toHaveProperty('reputation');
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not include email in user profile detail', async () => {
      // Create a user
      await prisma.profile.create({
        data: {
          userId: 'user-detail-test',
          pseudonym: 'DetailUser',
          reputation: 50,
        },
      });

      // Fetch user detail
      const user = await getUserByPseudonym('DetailUser');

      expect(user).not.toBeNull();
      expect(user).toHaveProperty('pseudonym');
      expect(user).toHaveProperty('reputation');
      expect(user).not.toHaveProperty('userId');
      expect(user).not.toHaveProperty('email');
    });
  });

  describe('Property 43: User profile page content', () => {
    it('should display user questions and answers on profile page', async () => {
      // Create a user
      const user = await prisma.profile.create({
        data: {
          userId: 'user-content-test',
          pseudonym: 'ContentUser',
          reputation: 50,
        },
      });

      // Create questions
      const question = await prisma.question.create({
        data: {
          title: 'User Question',
          content: 'Question content',
          status: 'APPROVED',
          authorId: user.id,
        },
      });

      // Create answers
      await prisma.answer.create({
        data: {
          content: 'User answer',
          status: 'APPROVED',
          questionId: question.id,
          authorId: user.id,
        },
      });

      // Fetch user profile
      const profile = await getUserByPseudonym('ContentUser');

      expect(profile).not.toBeNull();
      expect(profile?.questions).toHaveLength(1);
      expect(profile?.answers).toHaveLength(1);
      expect(profile?.questions[0].title).toBe('User Question');
      expect(profile?.answers[0].content).toBe('User answer');
    });

    /**
     * Feature: smvitm-tech-forum, Property 43: User profile page content
     * Validates: Requirements 15.4
     */
    it('for any user, profile page should display their questions and answers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 0, max: 5 }),
          async (numQuestions, numAnswers) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create a user
            const user = await prisma.profile.create({
              data: {
                userId: `user-${Date.now()}-${Math.random()}`,
                pseudonym: `User${Date.now()}${Math.random()}`,
                reputation: 50,
              },
            });

            // Create questions
            for (let i = 0; i < numQuestions; i++) {
              await prisma.question.create({
                data: {
                  title: `Question ${i}`,
                  content: `Content ${i}`,
                  status: 'APPROVED',
                  authorId: user.id,
                },
              });
            }

            // Create a question for answers
            const question = await prisma.question.create({
              data: {
                title: 'Question for answers',
                content: 'Content',
                status: 'APPROVED',
                authorId: user.id,
              },
            });

            // Create answers
            for (let i = 0; i < numAnswers; i++) {
              await prisma.answer.create({
                data: {
                  content: `Answer ${i}`,
                  status: 'APPROVED',
                  questionId: question.id,
                  authorId: user.id,
                },
              });
            }

            // Fetch user profile
            const profile = await getUserByPseudonym(user.pseudonym!);

            expect(profile).not.toBeNull();
            expect(profile?.questions.length).toBe(Math.min(numQuestions + 1, 10)); // +1 for answer question, max 10
            expect(profile?.answers.length).toBe(Math.min(numAnswers, 10)); // max 10
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 44: User list pagination', () => {
    it('should paginate user list correctly', async () => {
      // Create 25 users
      for (let i = 0; i < 25; i++) {
        await prisma.profile.create({
          data: {
            userId: `user-${i}`,
            pseudonym: `User${i}`,
            reputation: i,
          },
        });
      }

      // Fetch first page (20 users)
      const page1 = await getUsers(1, 20);
      expect(page1).toHaveLength(20);

      // Fetch second page (5 users)
      const page2 = await getUsers(2, 20);
      expect(page2).toHaveLength(5);

      // Verify no overlap
      const page1Ids = page1.map((u) => u.id);
      const page2Ids = page2.map((u) => u.id);
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    /**
     * Feature: smvitm-tech-forum, Property 44: User list pagination
     * Validates: Requirements 15.5
     */
    it('for any page size, pagination should return correct subset without overlap', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 30 }),
          fc.integer({ min: 5, max: 15 }),
          async (totalUsers, pageSize) => {
            // Clean up for this iteration
            await prisma.vote.deleteMany({});
            await prisma.answer.deleteMany({});
            await prisma.question.deleteMany({});
            await prisma.profile.deleteMany({});

            // Create users
            for (let i = 0; i < totalUsers; i++) {
              await prisma.profile.create({
                data: {
                  userId: `user-${Date.now()}-${i}-${Math.random()}`,
                  pseudonym: `User${Date.now()}${i}${Math.random()}`,
                  reputation: i,
                },
              });
            }

            // Fetch first two pages
            const page1 = await getUsers(1, pageSize);
            const page2 = await getUsers(2, pageSize);

            // Verify page 1 size
            expect(page1.length).toBe(Math.min(pageSize, totalUsers));

            // Verify page 2 size
            const expectedPage2Size = Math.max(0, Math.min(pageSize, totalUsers - pageSize));
            expect(page2.length).toBe(expectedPage2Size);

            // Verify no overlap if both pages have content
            if (page1.length > 0 && page2.length > 0) {
              const page1Ids = page1.map((u) => u.id);
              const page2Ids = page2.map((u) => u.id);
              const overlap = page1Ids.filter((id) => page2Ids.includes(id));
              expect(overlap).toHaveLength(0);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('User search', () => {
    it('should search users by pseudonym', async () => {
      // Create users
      await prisma.profile.create({
        data: {
          userId: 'user-1',
          pseudonym: 'JavaScriptDev',
          reputation: 100,
        },
      });

      await prisma.profile.create({
        data: {
          userId: 'user-2',
          pseudonym: 'PythonDev',
          reputation: 50,
        },
      });

      await prisma.profile.create({
        data: {
          userId: 'user-3',
          pseudonym: 'JavaDev',
          reputation: 75,
        },
      });

      // Search for "Java"
      const results = await searchUsers('Java');

      expect(results).toHaveLength(2);
      expect(results.some((u) => u.pseudonym === 'JavaScriptDev')).toBe(true);
      expect(results.some((u) => u.pseudonym === 'JavaDev')).toBe(true);
    });

    it('should return empty array for empty query', async () => {
      const results = await searchUsers('');
      expect(results).toHaveLength(0);
    });
  });

  describe('User count', () => {
    it('should return correct total user count', async () => {
      // Create users
      for (let i = 0; i < 15; i++) {
        await prisma.profile.create({
          data: {
            userId: `user-${i}`,
            pseudonym: `User${i}`,
            reputation: i,
          },
        });
      }

      const count = await getUserCount();
      expect(count).toBe(15);
    });
  });
});
