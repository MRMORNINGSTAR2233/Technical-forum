import Link from 'next/link';
import {
  Home,
  Globe,
  MessageSquare,
  Tag,
  Users,
  HelpCircle,
  Settings,
  Star,
} from 'lucide-react';
import { getCurrentUser } from '@/app/actions/auth';
import { getUnansweredCount } from '@/app/actions/unanswered';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/questions', label: 'Questions', icon: Globe },
  { href: '/tags', label: 'Tags', icon: Tag },
  { href: '/users', label: 'Users', icon: Users },
];

const publicItems = [
  { href: '/questions', label: 'Questions', icon: MessageSquare },
  { href: '/tags', label: 'Tags', icon: Tag },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/questions/unanswered', label: 'Unanswered', icon: HelpCircle, showCount: true },
];

const moderatorNavItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export async function LeftSidebar() {
  const user = await getCurrentUser();
  const unansweredCount = await getUnansweredCount();

  return (
    <aside className="hidden lg:block w-[164px] border-r border-gray-300 pt-6 sticky top-[50px] h-[calc(100vh-50px)] overflow-y-auto">
      <nav className="space-y-1 px-2">
        {/* Home */}
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1 text-sm text-[#525960] hover:text-[#242729] hover:bg-gray-100 rounded transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>

        {/* PUBLIC section */}
        <div className="pt-4">
          <div className="px-2 py-1 text-xs font-semibold text-[#6a737c] uppercase tracking-wide">
            Public
          </div>
          {publicItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-2 py-1 text-sm text-[#525960] hover:text-[#242729] hover:bg-gray-100 rounded transition-colors group"
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.showCount && unansweredCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-[#f48024] text-white rounded">
                  {unansweredCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Moderator section */}
        {user?.profile?.role === 'MODERATOR' && (
          <div className="pt-4 border-t border-gray-300 mt-4">
            <div className="px-2 py-1 text-xs font-semibold text-[#6a737c] uppercase tracking-wide">
              Moderator
            </div>
            {moderatorNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-2 py-1 text-sm text-[#525960] hover:text-[#242729] hover:bg-gray-100 rounded transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
