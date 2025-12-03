'use client';

import { useState } from 'react';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { createQuestion } from '@/app/actions/questions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function AskQuestionForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const result = await createQuestion(title, content, tagArray);

      if ('error' in result) {
        setError(result.error || 'An error occurred');
      } else {
        router.push(`/questions/${result.questionId}`);
      }
    } catch (_err) {
      setError('Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-[#f2dede] border border-[#ebccd1] text-[#a94442] px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="bg-white border border-gray-300 rounded-md p-6">
        <label
          htmlFor="title"
          className="block text-base font-semibold text-[#0c0d0e] mb-1"
        >
          Title
        </label>
        <p className="text-xs text-[#6a737c] mb-2">
          Be specific and imagine you&apos;re asking a question to another person.
        </p>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-2 py-2 border border-gray-300 rounded text-[13px] focus:outline-none focus:ring-1 focus:ring-[#6cbbf7] focus:border-[#6cbbf7]"
          placeholder="e.g. Is there an R function for finding the index of an element in a vector?"
          required
          maxLength={300}
        />
        <p className="text-xs text-[#6a737c] mt-1">
          {title.length}/300 characters
        </p>
      </div>

      {/* Body */}
      <div className="bg-white border border-gray-300 rounded-md p-6">
        <label className="block text-base font-semibold text-[#0c0d0e] mb-1">
          What are the details of your problem?
        </label>
        <p className="text-xs text-[#6a737c] mb-2">
          Introduce the problem and expand on what you put in the title. Minimum 20 characters.
        </p>
        <RichTextEditor
          content={content}
          onChange={setContent}
        />
      </div>

      {/* Tags */}
      <div className="bg-white border border-gray-300 rounded-md p-6">
        <label
          htmlFor="tags"
          className="block text-base font-semibold text-[#0c0d0e] mb-1"
        >
          Tags
        </label>
        <p className="text-xs text-[#6a737c] mb-2">
          Add up to 5 tags to describe what your question is about. Start typing to see suggestions.
        </p>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-2 py-2 border border-gray-300 rounded text-[13px] focus:outline-none focus:ring-1 focus:ring-[#6cbbf7] focus:border-[#6cbbf7]"
          placeholder="e.g. javascript, react, typescript (comma-separated)"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || !title || !content}
          className="bg-[#0a95ff] hover:bg-[#0074cc] disabled:bg-gray-400 disabled:cursor-not-allowed px-3 py-2.5 text-[13px]"
        >
          {isSubmitting ? 'Posting...' : 'Post your question'}
        </Button>
        <Button
          type="button"
          onClick={() => router.back()}
          variant="outline"
          className="px-3 py-2.5 text-[13px]"
        >
          Discard draft
        </Button>
      </div>
    </form>
  );
}
