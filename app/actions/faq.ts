'use server';

import { prisma } from '@/lib/prisma';

export interface FAQ {
  id: string;
  topic: string;
  question: string;
  answer: string;
  sourceQuestionId: string | null;
  generatedAt: Date;
}

/**
 * Fetch recent FAQs
 */
export async function getRecentFAQs(limit: number = 5): Promise<FAQ[]> {
  try {
    const faqs = await prisma.aI_FAQ.findMany({
      orderBy: {
        generatedAt: 'desc',
      },
      take: limit,
    });

    return faqs;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

/**
 * Get FAQ count
 */
export async function getFAQCount(): Promise<number> {
  try {
    return await prisma.aI_FAQ.count();
  } catch (error) {
    console.error('Error getting FAQ count:', error);
    return 0;
  }
}
