import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { PseudonymSelector } from '@/components/auth/pseudonym-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // If user already has a pseudonym, redirect to home
  if (user.profile?.pseudonym) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Choose your identity
          </CardTitle>
          <CardDescription>
            Select a unique pseudonym for the forum. This will be your public
            identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PseudonymSelector userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
