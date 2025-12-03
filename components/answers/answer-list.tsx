import { getAnswersForQuestion } from '@/app/actions/answers';
import { getCurrentUser } from '@/app/actions/auth';
import { AnswerCard } from './answer-card';

interface AnswerListProps {
  questionId: string;
  questionAuthorId: string;
}

export async function AnswerList({
  questionId,
  questionAuthorId,
}: AnswerListProps) {
  const answers = await getAnswersForQuestion(questionId);
  const user = await getCurrentUser();

  const isQuestionAuthor = user?.profile?.id === questionAuthorId;

  if (answers.length === 0) {
    return (
      <p className="text-gray-500">
        No answers yet. Be the first to answer!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {answers.map((answer) => (
        <AnswerCard
          key={answer.id}
          id={answer.id}
          content={answer.content}
          author={answer.author}
          isAccepted={answer.isAccepted}
          voteScore={answer.voteScore}
          createdAt={answer.createdAt}
          questionId={questionId}
          isQuestionAuthor={isQuestionAuthor}
        />
      ))}
    </div>
  );
}
