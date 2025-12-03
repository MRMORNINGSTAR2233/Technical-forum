import Link from 'next/link';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { UserPlus, Shield, Users } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      {/* Main Card */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#242729] mb-2">
            Join SMVITM Forum
          </h1>
          <p className="text-sm text-[#6a737c]">
            Create an account with your @sode-edu.in email
          </p>
        </div>

        <SignUpForm />

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-[#6a737c]">
            Already have an account?{' '}
            <Link
              href="/sign-in"
              className="text-[#0074cc] hover:text-[#0a95ff] font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3 text-sm">
          <UserPlus className="w-5 h-5 text-[#0a95ff] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#242729] font-medium">Join the community</p>
            <p className="text-[#6a737c]">Connect with fellow SMVITM students</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Shield className="w-5 h-5 text-[#0a95ff] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#242729] font-medium">Anonymous identity</p>
            <p className="text-[#6a737c]">Choose a pseudonym for privacy</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Users className="w-5 h-5 text-[#0a95ff] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#242729] font-medium">Build reputation</p>
            <p className="text-[#6a737c]">Earn points by helping others</p>
          </div>
        </div>
      </div>
    </div>
  );
}
