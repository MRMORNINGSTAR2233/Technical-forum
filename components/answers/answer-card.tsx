'use client';

import Link from 'next/link';
import { AcceptAnswerButton } from './accept-answer-button';
import { VotingControls } from '@/components/voting/voting-controls';

interface AnswerCardProps {
  id: string;
  content: string;
  author: {
    pseudonym: string | null;
    reputation: number;
  };
  isAccepted: boolean;
  voteScore: number;
  createdAt: Date;
  questionId: string;
  isQuestionAuthor: boolean;
  isOwnPost?: boolean;
  isAuthenticated?: boolean;
}

export function AnswerCard({
  id,
  content,
  author,
  isAccepted,
  voteScore,
  createdAt,
  questionId,
  isQuestionAuthor,
  isOwnPost = false,
  isAuthenticated = false,
}: AnswerCardProps) {
  return (
    <div className="border-b pb-6">
      <div className="flex gap-6">
        {/* Voting Column */}
        <div className="flex flex-col items-center gap-2">
          <VotingControls
            targetId={id}
            targetType="answer"
            initialScore={voteScore}
            isOwnPost={isOwnPost}
            isAuthenticated={isAuthenticated}
          />
          
          {/* Accept Answer Button */}
          <AcceptAnswerButton
            answerId={id}
            questionId={questionId}
            isAccepted={isAccepted}
            isQuestionAuthor={isQuestionAuthor}
          />
        </div>

        {/* Content Column */}
        <div className="flex-1">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Author Info */}
          <div className="mt-6 flex justify-end">
            <div className={`p-4 rounded ${isAccepted ? 'bg-green-50' : 'bg-blue-50'}`}>
              <div className="text-sm text-gray-600">
                answered {new Date(createdAt).toLocaleDateString()}
              </div>
              <Link
                href={`/users/${author.pseudonym}`}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                {author.pseudonym || 'Anonymous'}
              </Link>
              <div className="text-sm text-gray-600">
                {author.reputation} reputation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
