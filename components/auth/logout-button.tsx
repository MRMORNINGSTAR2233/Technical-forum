'use client';

import { signOut } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#6a737c] hover:text-[#242729] hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
      title="Log out"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">{isLoading ? 'Logging out...' : 'Log out'}</span>
    </button>
  );
}
