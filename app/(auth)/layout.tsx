import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9f9] flex flex-col">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#f48024] to-[#f48024] rounded flex items-center justify-center text-white font-bold shadow-sm">
              S
            </div>
            <span className="font-semibold text-[#242729] text-lg">
              SMVITM Forum
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#6a737c]">
          <p>© 2024 SMVITM Technical Forum. For students, by students.</p>
        </div>
      </footer>
    </div>
  );
}
