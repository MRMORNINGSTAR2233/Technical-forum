import { getAllTags } from '@/app/actions/tags';
import { TagBadge } from './tag-badge';
import { Tag } from 'lucide-react';

export async function TagList() {
  const tags = await getAllTags();

  if (tags.length === 0) {
    return (
      <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-400 mb-2">
          <Tag className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No tags yet</h3>
        <p className="text-sm text-gray-600">
          Tags will appear here once questions are posted
        </p>
      </div>
    );
  }

  // Group tags by first letter
  const tagsByLetter = tags.reduce((acc, tag) => {
    const firstLetter = tag.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(tag);
    return acc;
  }, {} as Record<string, typeof tags>);

  const letters = Object.keys(tagsByLetter).sort();

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">All Tags</h2>
            <p className="text-sm text-gray-600 mt-1">
              {tags.length} tag{tags.length !== 1 ? 's' : ''} in total
            </p>
          </div>
          <Tag className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Tags grouped by letter */}
      {letters.map((letter) => (
        <div key={letter} className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
            {letter}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tagsByLetter[letter].map((tag) => (
              <div
                key={tag.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <TagBadge
                  name={tag.name}
                  href={`/questions/tagged/${tag.name}`}
                  size="md"
                />
                <div className="mt-2 text-sm text-gray-600">
                  {tag.questionCount} question{tag.questionCount !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
