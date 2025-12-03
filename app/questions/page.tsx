import { QuestionFeed } from '@/components/questions/question-feed';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '../actions/auth';

export default async function QuestionsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#242729]">
          All Questions
        </h1>
        {user?.profile?.pseudonym && (
          <Link href="/questions/ask">
            <Button className="bg-[#0a95ff] hover:bg-[#0074cc]">
              Ask Question
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-300">
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm text-[#242729] border-b-2 border-[#f48024] font-medium">
            Newest
          </button>
          <button className="px-3 py-2 text-sm text-gray-600 hover:text-[#242729] border-b-2 border-transparent hover:border-gray-300 transition-colors">
            Active
          </button>
          <button className="px-3 py-2 text-sm text-gray-600 hover:text-[#242729] border-b-2 border-transparent hover:border-gray-300 transition-colors">
            Unanswered
          </button>
          <button className="px-3 py-2 text-sm text-gray-600 hover:text-[#242729] border-b-2 border-transparent hover:border-gray-300 transition-colors">
            More
          </button>
        </div>
        <button className="px-3 py-1.5 text-sm text-[#6a737c] border border-gray-300 rounded hover:bg-gray-50 transition-colors">
          Filter
        </button>
      </div>

      {/* Questions Feed */}
      <QuestionFeed filter="all" />
    </div>
  );
}
