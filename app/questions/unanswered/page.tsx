import { getUnansweredQuestions, getUnansweredCount } from '@/app/actions/unanswered';
import { QuestionCard } from '@/components/questions/question-card';
import { MessageSquareOff } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Unanswered Questions | SMVITM Tech Forum',
  description: 'Browse questions that need answers',
};

export default async function UnansweredQuestionsPage() {
  const [questions, count] = await Promise.all([
    getUnansweredQuestions(),
    getUnansweredCount(),
  ]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquareOff className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Unanswered Questions
          </h1>
        </div>
        <p className="text-gray-600">
          {count} question{count !== 1 ? 's' : ''} waiting for answers
        </p>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-gray-400 mb-2">
            <MessageSquareOff className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            All questions have been answered!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Great job community! Check back later for new questions.
          </p>
          <Link
            href="/questions"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Browse All Questions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              id={question.id}
              title={question.title}
              content={question.content}
              author={question.author}
              voteScore={question.voteScore}
              answerCount={0}
              views={question.views}
              tags={question.tags}
              createdAt={question.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
