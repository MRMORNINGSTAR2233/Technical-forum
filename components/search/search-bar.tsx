'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Debounced search
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#838c95]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-white border border-[#babfc4] rounded text-[#3b4045] placeholder:text-[#838c95] focus:outline-none focus:ring-1 focus:ring-[#6cbbf7] focus:border-[#6cbbf7] focus:shadow-[0_0_0_4px_rgba(0,116,204,0.15)]"
        />
      </div>
    </form>
  );
}
