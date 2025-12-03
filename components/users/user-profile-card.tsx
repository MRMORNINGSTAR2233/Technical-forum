'use client';

import Link from 'next/link';
import { MessageSquare, HelpCircle, Award } from 'lucide-react';

interface UserProfileCardProps {
  pseudonym: string | null;
  reputation: number;
  questionCount: number;
  answerCount: number;
  createdAt: Date;
}

export function UserProfileCard({
  pseudonym,
  reputation,
  questionCount,
  answerCount,
  createdAt,
}: UserProfileCardProps) {
  return (
    <Link
      href={`/users/${pseudonym}`}
      className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
    >
      {/* Pseudonym and Reputation */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {pseudonym || 'Anonymous'}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <Award className="w-4 h-4 text-yellow-600" />
          <span className="font-semibold text-gray-700">
            {reputation.toLocaleString()} reputation
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          <span>
            {questionCount} question{questionCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <HelpCircle className="w-4 h-4" />
          <span>
            {answerCount} answer{answerCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Member since */}
      <div className="mt-4 text-xs text-gray-500">
        Member since {new Date(createdAt).toLocaleDateString()}
      </div>
    </Link>
  );
}
