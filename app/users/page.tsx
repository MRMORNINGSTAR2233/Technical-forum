import { UserList } from '@/components/users/user-list';
import { getUserCount } from '@/app/actions/users';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Users | SMVITM Tech Forum',
  description: 'Browse community members sorted by reputation',
};

export default async function UsersPage() {
  const totalUsers = await getUserCount();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        </div>
        <p className="text-gray-600">
          {totalUsers.toLocaleString()} community member
          {totalUsers !== 1 ? 's' : ''} sorted by reputation
        </p>
      </div>

      {/* User List */}
      <UserList />
    </div>
  );
}
