import { describe, it, expect } from 'vitest';
import { prisma } from './prisma';

describe('Prisma Client', () => {
  it('should be defined', () => {
    expect(prisma).toBeDefined();
  });

  it('should have all models', () => {
    expect(prisma.profile).toBeDefined();
    expect(prisma.question).toBeDefined();
    expect(prisma.answer).toBeDefined();
    expect(prisma.vote).toBeDefined();
    expect(prisma.tag).toBeDefined();
    expect(prisma.aI_FAQ).toBeDefined();
    expect(prisma.globalSettings).toBeDefined();
  });
});
