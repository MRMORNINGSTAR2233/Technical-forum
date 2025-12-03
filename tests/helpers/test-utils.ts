import { prisma } from '@/lib/prisma';
import { Role, PostStatus } from '@prisma/client';

// Counter to ensure unique IDs across all tests
let testCounter = 0;

/**
 * Generate a unique test ID
 */
export function uniqueId(prefix: string = 'test'): string {
  testCounter++;
  return `${prefix}-${Date.now()}-${testCounter}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Clean up all test data from the database
 * This should be called in beforeEach to ensure test isolation
 */
export async function cleanupDatabase() {
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.vote.deleteMany({});
    await prisma.answer.deleteMany({});
    // Disconnect tags from questions first
    await prisma.$executeRaw`DELETE FROM "_QuestionTags"`;
    await prisma.question.deleteMany({});
    await prisma.aI_FAQ.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.profile.deleteMany({});
  } catch (error) {
    console.error('Database cleanup error:', error);
    throw error;
  }
}

/**
 * Create a test profile with default values
 */
export async function createTestProfile(overrides?: {
  userId?: string;
  pseudonym?: string;
  reputation?: number;
  role?: Role;
}) {
  const userId = overrides?.userId || `test-user-${Date.now()}-${Math.random()}`;
  const pseudonym = overrides?.pseudonym || `TestUser${Math.random().toString(36).substring(7)}`;
  
  return await prisma.profile.create({
    data: {
      userId,
      pseudonym,
      reputation: overrides?.reputation ?? 0,
      role: overrides?.role ?? Role.STUDENT,
    },
  });
}

/**
 * Create a test question with a valid author
 */
export async function createTestQuestion(overrides?: {
  title?: string;
  content?: string;
  status?: PostStatus;
  authorId?: string;
  tags?: string[];
}) {
  // Create author if not provided
  let authorId = overrides?.authorId;
  if (!authorId) {
    const author = await createTestProfile();
    authorId = author.id;
  }

  const question = await prisma.question.create({
    data: {
      title: overrides?.title || 'Test Question',
      content: overrides?.content || 'Test content',
      status: overrides?.status || PostStatus.APPROVED,
      authorId,
    },
  });

  // Add tags if provided
  if (overrides?.tags && overrides.tags.length > 0) {
    for (const tagName of overrides.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {},
      });

      await prisma.question.update({
        where: { id: question.id },
        data: {
          tags: {
            connect: { id: tag.id },
          },
        },
      });
    }
  }

  return question;
}

/**
 * Create a test answer with a valid author and question
 */
export async function createTestAnswer(overrides?: {
  content?: string;
  status?: PostStatus;
  isAccepted?: boolean;
  questionId?: string;
  authorId?: string;
}) {
  // Create author if not provided
  let authorId = overrides?.authorId;
  if (!authorId) {
    const author = await createTestProfile();
    authorId = author.id;
  }

  // Create question if not provided
  let questionId = overrides?.questionId;
  if (!questionId) {
    const question = await createTestQuestion();
    questionId = question.id;
  }

  return await prisma.answer.create({
    data: {
      content: overrides?.content || 'Test answer',
      status: overrides?.status || PostStatus.APPROVED,
      isAccepted: overrides?.isAccepted ?? false,
      questionId,
      authorId,
    },
  });
}
