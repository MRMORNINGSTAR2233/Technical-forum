/**
 * Calculate hot score for a question
 * Combines views, votes, answers, and recency
 * 
 * Formula: (views * 0.1) + (votes * 2) + (answers * 5) + (recency_bonus)
 * Recency bonus: 10 points if created in last 24 hours, 5 if in last 48 hours
 */
export function calculateHotScore(
  views: number,
  voteScore: number,
  answerCount: number,
  createdAt: Date
): number {
  const now = Date.now();
  const ageInHours = (now - createdAt.getTime()) / (1000 * 60 * 60);

  // Recency bonus
  let recencyBonus = 0;
  if (ageInHours <= 24) {
    recencyBonus = 10;
  } else if (ageInHours <= 48) {
    recencyBonus = 5;
  }

  // Calculate hot score
  const hotScore =
    views * 0.1 +
    voteScore * 2 +
    answerCount * 5 +
    recencyBonus;

  return hotScore;
}

export interface HotQuestion {
  id: string;
  title: string;
  views: number;
  voteScore: number;
  answerCount: number;
  createdAt: Date;
  hotScore: number;
}

/**
 * Rank questions by hot score
 */
export function rankQuestionsByHotScore(
  questions: Omit<HotQuestion, 'hotScore'>[]
): HotQuestion[] {
  const questionsWithScores = questions.map((q) => ({
    ...q,
    hotScore: calculateHotScore(q.views, q.voteScore, q.answerCount, q.createdAt),
  }));

  return questionsWithScores.sort((a, b) => b.hotScore - a.hotScore);
}
