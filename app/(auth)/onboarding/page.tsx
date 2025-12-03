import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { PseudonymSelector } from '@/components/auth/pseudonym-selector';
import { Shield, Eye, Award } from 'lucide-react';

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // If user already has a pseudonym (and it's not "Unknown"), redirect to home
  if (user.profile?.pseudonym && user.profile.pseudonym !== 'Unknown') {
    redirect('/');
  }

  return (
    <div className="w-full max-w-md">
      {/* Main Card */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0a95ff] to-[#0074cc] rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#242729] mb-2">
            Choose Your Pseudonym
          </h1>
          <p className="text-sm text-[#6a737c]">
            This will be your unique identity on the forum. Choose wisely!
          </p>
        </div>

        <PseudonymSelector userId={user.id} />
      </div>

      {/* Info Cards */}
      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3 text-sm">
          <Eye className="w-5 h-5 text-[#0a95ff] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#242729] font-medium">Stay anonymous</p>
            <p className="text-[#6a737c]">
              Your real identity remains private. Only your pseudonym is visible.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Award className="w-5 h-5 text-[#0a95ff] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#242729] font-medium">Build your reputation</p>
            <p className="text-[#6a737c]">
              Earn reputation points by asking questions and helping others.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Shield className="w-5 h-5 text-[#0a95ff] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#242729] font-medium">Update anytime</p>
            <p className="text-[#6a737c]">
              You can skip for now and set your pseudonym later from your profile page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
