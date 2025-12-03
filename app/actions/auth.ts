'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signUp(email: string, password: string) {
  // Validate email domain
  if (!email.endsWith('@sode-edu.in')) {
    return { error: 'Only @sode-edu.in email addresses are allowed' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    return { userId: data.user.id };
  }

  return { error: 'Failed to create account' };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/sign-in');
}

export async function checkPseudonymAvailability(
  pseudonym: string
): Promise<boolean> {
  const existing = await prisma.profile.findUnique({
    where: { pseudonym },
  });

  return !existing;
}

export async function createProfile(userId: string, pseudonym: string) {
  // Check if pseudonym is available
  const isAvailable = await checkPseudonymAvailability(pseudonym);

  if (!isAvailable) {
    return { error: 'Pseudonym is already taken' };
  }

  // Validate pseudonym format (alphanumeric, 3-20 characters)
  const pseudonymRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!pseudonymRegex.test(pseudonym)) {
    return {
      error:
        'Pseudonym must be 3-20 characters and contain only letters, numbers, and underscores',
    };
  }

  try {
    // Use upsert to create or update the profile
    await prisma.profile.upsert({
      where: { userId },
      update: { pseudonym },
      create: {
        userId,
        pseudonym,
        reputation: 0,
        role: 'STUDENT',
      },
    });

    // Only revalidate in Next.js runtime context
    try {
      revalidatePath('/', 'layout');
    } catch (e) {
      // Ignore revalidation errors in test environment
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating profile:', error);
    return { error: 'Failed to create profile' };
  }
}

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get the profile
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return {
    id: user.id,
    email: user.email,
    profile,
  };
}

export async function getProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      pseudonym: true,
      reputation: true,
      role: true,
      createdAt: true,
      // Explicitly exclude userId and updatedAt for privacy
    },
  });

  return profile;
}
