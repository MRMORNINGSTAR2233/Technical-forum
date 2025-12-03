import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getGlobalSettings } from '@/app/actions/settings';
import { AutoApproveToggle } from '@/components/settings/auto-approve-toggle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  // Only moderators can access settings
  if (!user || user.profile?.role !== 'MODERATOR') {
    redirect('/');
  }

  const settings = await getGlobalSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-so-black">Forum Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage global forum settings and moderation preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderation Settings</CardTitle>
          <CardDescription>
            Configure how posts are moderated on the forum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoApproveToggle initialValue={settings.autoApproveEnabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Auto-Approve</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>When enabled:</strong> All new questions and answers will
            be immediately visible to everyone without requiring moderator
            approval.
          </p>
          <p>
            <strong>When disabled:</strong> New posts will be held in the
            moderation queue and require manual approval before becoming
            visible.
          </p>
          <p>
            <strong>Recommendation:</strong> Enable auto-approve for trusted
            communities. Disable for new or high-traffic forums that need
            quality control.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
