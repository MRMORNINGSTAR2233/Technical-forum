import { Prisma } from '@prisma/client';

// Question with all relations
export type QuestionWithDetails = Prisma.QuestionGetPayload<{
  include: {
    author: true;
    tags: true;
    answers: {
      include: {
        author: true;
        votes: true;
      };
    };
    votes: true;
  };
}>;

// Answer with relations
export type AnswerWithDetails = Prisma.AnswerGetPayload<{
  include: {
    author: true;
    votes: true;
  };
}>;

// Profile with content
export type ProfileWithContent = Prisma.ProfileGetPayload<{
  include: {
    questions: true;
    answers: true;
  };
}>;

// Pending post for moderation
export type PendingPost = {
  id: string;
  type: 'question' | 'answer';
  title?: string;
  content: string;
  authorPseudonym: string;
  createdAt: Date;
  isStale: boolean;
};

// Vote with target info
export type VoteWithTarget = Prisma.VoteGetPayload<{
  include: {
    question: true;
    answer: true;
  };
}>;
