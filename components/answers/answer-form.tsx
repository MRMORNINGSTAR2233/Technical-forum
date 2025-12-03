'use client';

import { useState } from 'react';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { createAnswer } from '@/app/actions/answers';
import { useRouter } from 'next/navigation';

interface AnswerFormProps {
  questionId: string;
}

export function AnswerForm({ questionId }: AnswerFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await createAnswer(questionId, content);

      if ('error' in result) {
        setError(result.error);
      } else {
        setContent('');
        router.refresh();
      }
    } catch (err) {
      setError('Failed to post answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold">Your Answer</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Write your answer here..."
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || !content}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post Your Answer'}
        </button>
      </div>
    </form>
  );
}
