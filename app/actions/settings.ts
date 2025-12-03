'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

export async function getAutoApproveStatus(): Promise<boolean> {
  const settings = await prisma.globalSettings.findUnique({
    where: { id: 1 },
  });

  return settings?.autoApproveEnabled ?? false;
}

export async function setAutoApproveStatus(enabled: boolean) {
  // Check if user is a moderator
  const user = await getCurrentUser();

  if (!user || user.profile?.role !== 'MODERATOR') {
    return { error: 'Unauthorized: Only moderators can change settings' };
  }

  try {
    await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: { autoApproveEnabled: enabled },
      create: { id: 1, autoApproveEnabled: enabled },
    });

    try {
      revalidatePath('/settings');
      revalidatePath('/');
    } catch (e) {
      // Ignore revalidation errors in test environment
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { error: 'Failed to update settings' };
  }
}

export async function getGlobalSettings() {
  const settings = await prisma.globalSettings.findUnique({
    where: { id: 1 },
  });

  return (
    settings ?? {
      id: 1,
      autoApproveEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
}
