import Link from 'next/link';
import { SignInForm } from '@/components/auth/sign-in-form';

export default function SignInPage() {
  return (
    <div className="w-full max-w-[280px]">
      {/* Stack Overflow Logo */}
      <div className="flex justify-center mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-[#f48024] to-[#f48024] rounded flex items-center justify-center text-white font-bold shadow-sm">
          S
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-gray-300 rounded-md shadow-lg p-6">
        <SignInForm />
      </div>

      {/* Sign up link */}
      <div className="mt-6 text-center text-sm text-[#6a737c]">
        Don&apos;t have an account?{' '}
        <Link
          href="/sign-up"
          className="text-[#0074cc] hover:text-[#0a95ff]"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
