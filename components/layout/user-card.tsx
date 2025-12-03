import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { signOut } from '@/app/actions/auth';

interface UserCardProps {
  pseudonym: string;
  reputation: number;
}

export function UserCard({ pseudonym, reputation }: UserCardProps) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-600">Welcome,</p>
          <Link
            href="/profile"
            className="font-semibold text-so-black hover:text-so-orange transition-colors"
          >
            {pseudonym}
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium text-so-orange">{reputation}</span>{' '}
            reputation
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-gray-600" />
          </button>
        </form>
      </div>
    </div>
  );
}
