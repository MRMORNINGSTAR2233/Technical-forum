import { ModerationQueue } from '@/components/moderation/moderation-queue';
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Moderation Queue | SMVITM Tech Forum',
  description: 'Review and moderate pending posts',
};

export default async function ModerationQueuePage() {
  const user = await getCurrentUser();

  // Redirect if not logged in or not a moderator
  if (!user || !user.profile) {
    redirect('/auth/sign-in');
  }

  if (user.profile.role !== 'MODERATOR') {
    redirect('/');
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Moderation Queue
          </h1>
        </div>
        <p className="text-gray-600">
          Review and approve or reject pending posts from the community
        </p>
      </div>

      {/* Moderation Queue */}
      <ModerationQueue />
    </div>
  );
}
