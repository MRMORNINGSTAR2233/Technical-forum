'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, MessageSquare, Tag, Users, HelpCircle } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/questions', label: 'Questions', icon: MessageSquare },
  { href: '/tags', label: 'Tags', icon: Tag },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/questions/unanswered', label: 'Unanswered', icon: HelpCircle },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-bold text-lg text-so-orange">
          SMVITM Forum
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 top-[57px] bg-white z-40 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
