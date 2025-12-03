'use server';

import { prisma } from '@/lib/prisma';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  views: number;
  voteScore: number;
  answerCount: number;
  createdAt: Date;
  relevanceScore: number;
  author: {
    pseudonym: string | null;
    reputation: number;
  };
  tags: {
    id: string;
    name: string;
  }[];
}

/**
 * Calculate relevance score for search results
 * Higher score = more relevant
 */
function calculateRelevanceScore(
  question: {
    title: string;
    content: string;
    tags: { name: string }[];
  },
  searchTerm: string
): number {
  const lowerSearchTerm = searchTerm.toLowerCase();
  const lowerTitle = question.title.toLowerCase();
  const lowerContent = question.content.toLowerCase();
  
  let score = 0;

  // Exact title match: 100 points
  if (lowerTitle === lowerSearchTerm) {
    score += 100;
  }
  // Title contains search term: 50 points
  else if (lowerTitle.includes(lowerSearchTerm)) {
    score += 50;
  }
  // Title starts with search term: 30 points
  else if (lowerTitle.startsWith(lowerSearchTerm)) {
    score += 30;
  }

  // Content contains search term: 10 points
  if (lowerContent.includes(lowerSearchTerm)) {
    score += 10;
  }

  // Tag matches: 20 points per matching tag
  const matchingTags = question.tags.filter((tag) =>
    tag.name.toLowerCase().includes(lowerSearchTerm)
  );
  score += matchingTags.length * 20;

  return score;
}

/**
 * Search questions by title, content, and tags
 * Returns results sorted by relevance
 */
export async function searchQuestions(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const searchTerm = query.trim().toLowerCase();

    // Search in title, content, and tags (approved only)
    const questions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              some: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        views: true,
        createdAt: true,
        author: {
          select: {
            pseudonym: true,
            reputation: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        votes: {
          select: {
            value: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      take: 100, // Limit for performance
    });

    // Calculate vote scores and relevance scores
    const resultsWithScores: SearchResult[] = questions.map((q) => ({
      id: q.id,
      title: q.title,
      content: q.content,
      views: q.views,
      voteScore: q.votes.reduce((sum, vote) => sum + vote.value, 0),
      answerCount: q._count.answers,
      createdAt: q.createdAt,
      relevanceScore: calculateRelevanceScore(q, searchTerm),
      author: q.author,
      tags: q.tags,
    }));

    // Sort by relevance score descending
    resultsWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return resultsWithScores;
  } catch (error) {
    console.error('Error searching questions:', error);
    return [];
  }
}
