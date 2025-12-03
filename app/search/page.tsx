import { SearchResults } from '@/components/search/search-results';
import { SearchBar } from '@/components/search/search-bar';
import { Search } from 'lucide-react';
import { Suspense } from 'react';

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  return {
    title: query ? `Search: ${query} | SMVITM Tech Forum` : 'Search | SMVITM Tech Forum',
    description: 'Search for questions and answers',
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
        </div>

        {/* Search Bar */}
        <SearchBar />
      </div>

      {/* Search Results */}
      <Suspense
        fallback={
          <div className="p-12 text-center">
            <p className="text-gray-600">Searching...</p>
          </div>
        }
      >
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
