import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  // Create connection pool with proper settings for Supabase
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Store pool globally to prevent multiple pools in tests
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
