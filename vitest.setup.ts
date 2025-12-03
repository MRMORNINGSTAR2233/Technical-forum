import '@testing-library/jest-dom';
import { config } from 'dotenv';

// Load environment variables from .env file for tests
// This must be done before any other imports that depend on env vars
config();

// Verify the DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('WARNING: DATABASE_URL is not set!');
}

import { afterAll, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});