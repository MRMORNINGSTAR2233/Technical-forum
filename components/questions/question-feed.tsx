import { getQuestions } from '@/app/actions/questions';
import { QuestionCard } from './question-card';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface QuestionFeedProps {
  filter?: 'all' | 'unanswered' | 'hot';
  page?: number;
}

export async function QuestionFeed({
  filter = 'all',
  page = 1,
}: QuestionFeedProps) {
  const questions = await getQuestions(filter, page);

  if (questions.length === 0) {
    return (
      <div className="bg-white border border-gray-300 rounded-md p-12 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#242729] mb-2">
          No questions found
        </h3>
        <p className="text-[#6a737c] mb-4">
          Be the first to ask a question!
        </p>
        <Link href="/questions/ask">
          <Button className="bg-[#0a95ff] hover:bg-[#0074cc]">
            Ask Question
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-md shadow-sm">
      {questions.map((question) => (
        <div key={question.id}>
          <QuestionCard
            id={question.id}
            title={question.title}
            content={question.content}
            author={question.author}
            tags={question.tags}
            views={question.views}
            answerCount={question._count.answers}
            voteScore={question.voteScore}
            createdAt={question.createdAt}
          />
        </div>
      ))}
    </div>
  );
}
