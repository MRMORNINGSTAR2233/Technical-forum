import { getCachedHotQuestions } from '@/app/actions/hot-questions';
import Link from 'next/link';
import { Flame } from 'lucide-react';

export async function HotQuestionsWidget() {
  const hotQuestions = await getCachedHotQuestions(5);

  if (hotQuestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-5 h-5 text-orange-600" />
        <h3 className="font-bold text-gray-900">Hot Network Questions</h3>
      </div>

      <div className="space-y-3">
        {hotQuestions.map((question, index) => (
          <Link
            key={question.id}
            href={`/questions/${question.id}`}
            className="block group"
          >
            <div className="flex gap-2">
              <span className="text-sm font-semibold text-gray-400 flex-shrink-0">
                {index + 1}.
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-700 group-hover:text-blue-600 line-clamp-2">
                  {question.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{question.views} views</span>
                  <span>{question.answerCount} answers</span>
                  <span>{question.voteScore} votes</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
