import { LeftSidebar } from './left-sidebar';
import { RightSidebar } from './right-sidebar';
import { MobileNav } from './mobile-nav';
import { SearchBar } from '@/components/search/search-bar';
import Link from 'next/link';
import { getCurrentUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';

export async function ThreeColumnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#f8f9f9]">
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Desktop Header - Stack Overflow style */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white border-b border-gray-300 shadow-sm backdrop-blur-sm bg-opacity-95">
        <div className="max-w-[1264px] mx-auto flex items-center h-[50px] px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-4 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-[#f48024] to-[#f48024] rounded flex items-center justify-center text-white font-bold shadow-sm">
              S
            </div>
            <span className="font-semibold text-[#242729] hidden xl:inline">
              SMVITM Forum
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <SearchBar />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-4">
            {user ? (
              <>
                {user.profile?.pseudonym && (
                  <>
                    <Link href={`/users/${user.profile.pseudonym}`}>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors">
                        <div className="w-6 h-6 bg-[#0a95ff] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {user.profile.pseudonym.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#242729] hidden xl:inline">
                          {user.profile.pseudonym}
                        </span>
                        <span className="text-xs text-gray-600 hidden xl:inline">
                          {user.profile.reputation}
                        </span>
                      </div>
                    </Link>
                    <LogoutButton />
                  </>
                )}
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="outline" size="sm" className="text-sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="bg-[#0a95ff] hover:bg-[#0074cc] text-sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Three-Column Layout */}
      <div className="max-w-[1264px] mx-auto flex">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 py-6">
          {children}
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}
