import { getQuestionById, incrementViewCount } from '@/app/actions/questions';
import { getCurrentUser } from '@/app/actions/auth';
import Link from 'next/link';
import { Eye, MessageSquare } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AnswerList } from '@/components/answers/answer-list';
import { AnswerForm } from '@/components/answers/answer-form';
import { VotingControls } from '@/components/voting/voting-controls';

interface QuestionDetailViewProps {
  questionId: string;
}

export async function QuestionDetailView({
  questionId,
}: QuestionDetailViewProps) {
  // Increment view count
  await incrementViewCount(questionId);

  // Fetch question with answers
  const question = await getQuestionById(questionId);

  if (!question) {
    notFound();
  }

  // Get current user
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{question.title}</h1>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{question.views} views</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{question.answers.length} answers</span>
          </div>
          <span>•</span>
          <span>Asked {new Date(question.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex gap-6">
        {/* Voting Column */}
        <VotingControls
          targetId={questionId}
          targetType="question"
          initialScore={question.voteScore}
          isOwnPost={user?.profile?.id === question.authorId}
          isAuthenticated={!!user}
        />

        {/* Content Column */}
        <div className="flex-1">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: question.content }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-6">
            {question.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/questions/tagged/${tag.name}`}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                {tag.name}
              </Link>
            ))}
          </div>

          {/* Author Info */}
          <div className="mt-6 flex justify-end">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-gray-600">asked by</div>
              <Link
                href={`/users/${question.author.pseudonym}`}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                {question.author.pseudonym || 'Anonymous'}
              </Link>
              <div className="text-sm text-gray-600">
                {question.author.reputation} reputation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="border-t pt-6">
        <h2 className="text-2xl font-bold mb-4">
          {question.answers.length}{' '}
          {question.answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <AnswerList
          questionId={questionId}
          questionAuthorId={question.authorId}
        />
      </div>

      {/* Answer Form */}
      {user && user.profile && (
        <div className="border-t pt-6 mt-6">
          <AnswerForm questionId={questionId} />
        </div>
      )}
    </div>
  );
}
