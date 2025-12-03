import { getPendingPostCount } from '@/app/actions/moderation';
import { getCurrentUser } from '@/app/actions/auth';
import Link from 'next/link';
import { Shield, AlertCircle } from 'lucide-react';

export async function ModerationWidget() {
  const user = await getCurrentUser();

  // Only show widget to moderators
  if (!user || !user.profile || user.profile.role !== 'MODERATOR') {
    return null;
  }

  const count = await getPendingPostCount();

  // Handle error case
  if (typeof count === 'object' && 'error' in count) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-gray-900">Moderation Queue</h3>
      </div>

      <div className="space-y-3">
        {count > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-700">
                <span className="font-bold text-orange-600">{count}</span> post
                {count !== 1 ? 's' : ''} awaiting review
              </span>
            </div>

            <Link
              href="/mod/queue"
              className="block w-full px-4 py-2 bg-blue-600 text-white text-center text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
            >
              Review Posts
            </Link>
          </>
        ) : (
          <div className="text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              All posts reviewed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
