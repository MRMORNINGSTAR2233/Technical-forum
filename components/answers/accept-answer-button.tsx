'use client';

import { useState } from 'react';
import { acceptAnswer } from '@/app/actions/answers';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

interface AcceptAnswerButtonProps {
  answerId: string;
  questionId: string;
  isAccepted: boolean;
  isQuestionAuthor: boolean;
}

export function AcceptAnswerButton({
  answerId,
  questionId,
  isAccepted,
  isQuestionAuthor,
}: AcceptAnswerButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isQuestionAuthor) {
    return null;
  }

  const handleAccept = async () => {
    setIsSubmitting(true);

    try {
      const result = await acceptAnswer(answerId, questionId);

      if ('error' in result) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch (_err) {
      alert('Failed to accept answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleAccept}
      disabled={isSubmitting || isAccepted}
      className={`p-2 rounded ${
        isAccepted
          ? 'text-green-600 cursor-default'
          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
      }`}
      title={isAccepted ? 'Accepted answer' : 'Accept this answer'}
      aria-label={isAccepted ? 'Accepted answer' : 'Accept this answer'}
    >
      <Check className="w-8 h-8" strokeWidth={3} />
    </button>
  );
}
