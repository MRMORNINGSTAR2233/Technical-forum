import { getUsers } from '@/app/actions/users';
import { UserProfileCard } from './user-profile-card';
import { Users } from 'lucide-react';

interface UserListProps {
  page?: number;
  pageSize?: number;
}

export async function UserList({ page = 1, pageSize = 20 }: UserListProps) {
  const users = await getUsers(page, pageSize);

  if (users.length === 0) {
    return (
      <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-400 mb-2">
          <Users className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          No users found
        </h3>
        <p className="text-sm text-gray-600">
          Users will appear here once they join the forum
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <UserProfileCard
          key={user.id}
          pseudonym={user.pseudonym}
          reputation={user.reputation}
          questionCount={user.questionCount}
          answerCount={user.answerCount}
          createdAt={user.createdAt}
        />
      ))}
    </div>
  );
}
