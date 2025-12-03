'use client';

import { useState } from 'react';
import { approvePost, rejectPost } from '@/app/actions/moderation';
import { useRouter } from 'next/navigation';
import { Check, X, Clock } from 'lucide-react';

interface PostReviewCardProps {
  id: string;
  type: 'question' | 'answer';
  title?: string;
  content: string;
  author: {
    pseudonym: string | null;
  };
  createdAt: Date;
  isStale: boolean;
}

export function PostReviewCard({
  id,
  type,
  title,
  content,
  author,
  createdAt,
  isStale,
}: PostReviewCardProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await approvePost(id, type);

      if ('error' in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (_err) {
      setError('Failed to approve post');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await rejectPost(id, type);

      if ('error' in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (_err) {
      setError('Failed to reject post');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate time since creation
  const timeSinceCreation = Date.now() - createdAt.getTime();
  const hoursSince = Math.floor(timeSinceCreation / (1000 * 60 * 60));
  const minutesSince = Math.floor((timeSinceCreation % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div
      className={`border rounded-lg p-6 ${
        isStale ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                type === 'question'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {type.toUpperCase()}
            </span>
            {isStale && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                <Clock className="w-3 h-3" />
                STALE
              </span>
            )}
          </div>

          {title && (
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          )}

          <div className="text-sm text-gray-600">
            Posted by{' '}
            <span className="font-semibold">
              {author.pseudonym || 'Anonymous'}
            </span>{' '}
            • {hoursSince > 0 ? `${hoursSince}h ` : ''}
            {minutesSince}m ago
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <div
          className="prose prose-sm max-w-none line-clamp-3"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-4 h-4" />
          Approve
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-4 h-4" />
          Reject
        </button>

        {isProcessing && (
          <span className="text-sm text-gray-600">Processing...</span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
