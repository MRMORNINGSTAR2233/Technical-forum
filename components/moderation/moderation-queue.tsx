import { getPendingPosts } from '@/app/actions/moderation';
import { PostReviewCard } from './post-review-card';
import { AlertCircle } from 'lucide-react';

export async function ModerationQueue() {
  const result = await getPendingPosts();

  if ('error' in result) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">Error loading moderation queue</span>
        </div>
        <p className="mt-2 text-sm text-red-700">{result.error}</p>
      </div>
    );
  }

  const pendingPosts = result;

  if (pendingPosts.length === 0) {
    return (
      <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-400 mb-2">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          No pending posts
        </h3>
        <p className="text-sm text-gray-600">
          All posts have been reviewed. Great job!
        </p>
      </div>
    );
  }

  const staleCount = pendingPosts.filter((p) => p.isStale).length;

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Moderation Queue
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {pendingPosts.length} post{pendingPosts.length !== 1 ? 's' : ''}{' '}
              awaiting review
            </p>
          </div>
          {staleCount > 0 && (
            <div className="px-3 py-2 bg-red-100 border border-red-300 rounded">
              <span className="text-sm font-semibold text-red-800">
                {staleCount} stale post{staleCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pending Posts */}
      <div className="space-y-4">
        {pendingPosts.map((post) => (
          <PostReviewCard
            key={post.id}
            id={post.id}
            type={post.type}
            title={post.title}
            content={post.content}
            author={post.author}
            createdAt={post.createdAt}
            isStale={post.isStale}
          />
        ))}
      </div>
    </div>
  );
}
