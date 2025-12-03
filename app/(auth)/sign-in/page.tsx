import Link from 'next/link';
import { SignInForm } from '@/components/auth/sign-in-form';
import { LogIn, MessageSquare, TrendingUp } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="w-full max-w-md">
      {/* Main Card */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#242729] mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-[#6a737c]">
            Sign in to your SMVITM Forum account
          </p>
        </div>

        <SignInForm />

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-[#6a737c]">
            Don't have an account?{' '}
            <Link
              href="/sign-up"
              className="text-[#0074cc] hover:text-[#0a95ff] font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="mt-6 bg-[#ebf4fb] border border-[#a6ceed] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <LogIn className="w-5 h-5 text-[#0a95ff] flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-[#242729] font-medium mb-1">Student Access Only</p>
            <p className="text-[#3b4045]">
              Use your @sode-edu.in email to access the forum
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
