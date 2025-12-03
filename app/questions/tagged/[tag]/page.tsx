import { getQuestionsByTag, getTagByName } from '@/app/actions/tags';
import { QuestionCard } from '@/components/questions/question-card';
import { TagBadge } from '@/components/tags/tag-badge';
import { notFound } from 'next/navigation';
import { Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TaggedQuestionsPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export async function generateMetadata({ params }: TaggedQuestionsPageProps) {
  const { tag } = await params;
  const tagName = decodeURIComponent(tag);
  return {
    title: `Questions tagged [${tagName}] | SMVITM Tech Forum`,
    description: `Browse questions tagged with ${tagName}`,
  };
}

export default async function TaggedQuestionsPage({
  params,
}: TaggedQuestionsPageProps) {
  const { tag: tagParam } = await params;
  const tagName = decodeURIComponent(tagParam);

  // Fetch tag info
  const tagData = await getTagByName(tagName);

  if (!tagData) {
    notFound();
  }

  // Fetch questions with this tag
  const questions = await getQuestionsByTag(tagName);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back Link */}
      <Link
        href="/tags"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all tags
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Tag className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Questions tagged [{tagName}]
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <TagBadge name={tagData.name} size="lg" />
          <span className="text-gray-600">
            {tagData.questionCount} question{tagData.questionCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-gray-400 mb-2">
            <Tag className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No questions yet
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Be the first to ask a question with this tag!
          </p>
          <Link
            href="/questions/ask"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Ask Question
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
              answerCount={question.answerCount}
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
