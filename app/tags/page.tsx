import { TagList } from '@/components/tags/tag-list';
import { Tag } from 'lucide-react';

export const metadata = {
  title: 'Tags | SMVITM Tech Forum',
  description: 'Browse all tags and find questions by topic',
};

export default function TagsPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
        </div>
        <p className="text-gray-600">
          A tag is a keyword or label that categorizes your question with other,
          similar questions. Using the right tags makes it easier for others to
          find and answer your question.
        </p>
      </div>

      {/* Tag List */}
      <TagList />
    </div>
  );
}
