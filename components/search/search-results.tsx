import { searchQuestions } from '@/app/actions/search';
import { QuestionCard } from '@/components/questions/question-card';
import Link from 'next/link';

interface SearchResultsProps {
  query: string;
}

export async function SearchResults({ query }: SearchResultsProps) {
  if (!query || query.trim().length === 0) {
    return (
      <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Enter a search term to find questions</p>
      </div>
    );
  }

  const results = await searchQuestions(query);

  if (results.length === 0) {
    return (
      <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No results found for "{query}"
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Try different keywords or ask a new question
        </p>
        <Link
          href="/questions/ask"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Ask Question
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </p>
      {results.map((result) => (
        <QuestionCard
          key={result.id}
          id={result.id}
          title={result.title}
          content={result.content}
          author={result.author}
          voteScore={result.voteScore}
          answerCount={result.answerCount}
          views={result.views}
          tags={result.tags}
          createdAt={result.createdAt}
        />
      ))}
    </div>
  );
}
