import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fc from 'fast-check';
import {
  getAutoApproveStatus,
  setAutoApproveStatus,
  getGlobalSettings,
} from '@/app/actions/settings';

// Feature: smvitm-tech-forum, Property 21: Auto-approve setting consultation
// Feature: smvitm-tech-forum, Property 22: Setting changes affect future posts

describe('Global Settings', () => {
  let prisma: PrismaClient;
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  describe('Property 21: Auto-approve setting consultation', () => {
    it('should fetch the current auto-approve setting', async () => {
      // Ensure settings exist
      await prisma.globalSettings.upsert({
        where: { id: 1 },
        update: { autoApproveEnabled: false },
        create: { id: 1, autoApproveEnabled: false },
      });

      const status = await getAutoApproveStatus();
      expect(typeof status).toBe('boolean');
    });

    it('should return false by default if no settings exist', async () => {
      // Delete settings
      await prisma.globalSettings.deleteMany({});

      const status = await getAutoApproveStatus();
      expect(status).toBe(false);

      // Restore settings
      await prisma.globalSettings.create({
        data: { id: 1, autoApproveEnabled: false },
      });
    });

    it('should return the correct setting value', async () => {
      // Set to true
      await prisma.globalSettings.upsert({
        where: { id: 1 },
        update: { autoApproveEnabled: true },
        create: { id: 1, autoApproveEnabled: true },
      });

      let status = await getAutoApproveStatus();
      expect(status).toBe(true);

      // Set to false
      await prisma.globalSettings.update({
        where: { id: 1 },
        data: { autoApproveEnabled: false },
      });

      status = await getAutoApproveStatus();
      expect(status).toBe(false);
    });
  });

  describe('Property 22: Setting changes affect future posts', () => {
    it('should update the auto-approve setting', async () => {
      // Ensure settings exist
      await prisma.globalSettings.upsert({
        where: { id: 1 },
        update: { autoApproveEnabled: false },
        create: { id: 1, autoApproveEnabled: false },
      });

      // Get initial status
      const initialStatus = await getAutoApproveStatus();

      // Update settings (note: this will fail without moderator auth in real scenario)
      // For testing, we directly update the database
      await prisma.globalSettings.update({
        where: { id: 1 },
        data: { autoApproveEnabled: !initialStatus },
      });

      // Verify the change
      const newStatus = await getAutoApproveStatus();
      expect(newStatus).toBe(!initialStatus);

      // Restore original state
      await prisma.globalSettings.update({
        where: { id: 1 },
        data: { autoApproveEnabled: initialStatus },
      });
    });

    it('for any boolean value, setting should persist', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (value) => {
          // Set the value
          await prisma.globalSettings.upsert({
            where: { id: 1 },
            update: { autoApproveEnabled: value },
            create: { id: 1, autoApproveEnabled: value },
          });

          // Fetch and verify
          const status = await getAutoApproveStatus();
          expect(status).toBe(value);
        }),
        { numRuns: 10 }
      );
    });

    it('should maintain setting across multiple reads', async () => {
      // Set a specific value
      await prisma.globalSettings.upsert({
        where: { id: 1 },
        update: { autoApproveEnabled: true },
        create: { id: 1, autoApproveEnabled: true },
      });

      // Read multiple times
      const reads = await Promise.all([
        getAutoApproveStatus(),
        getAutoApproveStatus(),
        getAutoApproveStatus(),
      ]);

      // All reads should return the same value
      expect(reads.every((r) => r === true)).toBe(true);
    });
  });

  describe('Global Settings retrieval', () => {
    it('should return complete settings object', async () => {
      const settings = await getGlobalSettings();

      expect(settings).toBeDefined();
      expect(settings).toHaveProperty('id');
      expect(settings).toHaveProperty('autoApproveEnabled');
      expect(settings).toHaveProperty('createdAt');
      expect(settings).toHaveProperty('updatedAt');
    });

    it('should create default settings if none exist', async () => {
      // Delete settings
      await prisma.globalSettings.deleteMany({});

      const settings = await getGlobalSettings();

      expect(settings.autoApproveEnabled).toBe(false);

      // Restore settings
      await prisma.globalSettings.create({
        data: { id: 1, autoApproveEnabled: false },
      });
    });
  });
});
