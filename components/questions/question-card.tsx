'use client';

import Link from 'next/link';
import { Eye, MessageSquare, CheckCircle2 } from 'lucide-react';

interface QuestionCardProps {
  id: string;
  title: string;
  content: string;
  author: {
    pseudonym: string | null;
    reputation: number;
  };
  tags: { id: string; name: string }[];
  views: number;
  answerCount: number;
  voteScore: number;
  createdAt: Date;
}

export function QuestionCard({
  id,
  title,
  content,
  author,
  tags,
  views,
  answerCount,
  voteScore,
  createdAt,
}: QuestionCardProps) {
  // Strip HTML tags for preview
  const textContent = content.replace(/<[^>]*>/g, '');
  const preview =
    textContent.length > 200
      ? textContent.substring(0, 200) + '...'
      : textContent;

  const hasAcceptedAnswer = false; // TODO: Add this to props when available
  const timeAgo = getTimeAgo(new Date(createdAt));

  return (
    <div className="flex gap-4 py-4 border-b border-gray-300 last:border-b-0 hover:bg-[#fafafa] transition-all duration-150 px-4 -mx-4 group">
      {/* Stats Column */}
      <div className="flex flex-col gap-2 text-xs text-[#6a737c] min-w-[108px] flex-shrink-0">
        <div className="flex items-center justify-end gap-1.5">
          <span className="font-semibold text-[#242729]">{voteScore}</span>
          <span className="text-[#9199a1]">votes</span>
        </div>
        <div className={`flex items-center justify-end gap-1.5 ${answerCount > 0 ? 'text-[#2f6f44]' : ''}`}>
          {hasAcceptedAnswer && <CheckCircle2 className="w-3.5 h-3.5 text-[#2f6f44]" />}
          <span className={`font-semibold ${answerCount > 0 ? 'text-[#2f6f44]' : 'text-[#242729]'} ${hasAcceptedAnswer ? 'bg-[#2f6f44] text-white px-1.5 py-0.5 rounded' : ''}`}>
            {answerCount}
          </span>
          <span className="text-[#9199a1]">{answerCount === 1 ? 'answer' : 'answers'}</span>
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <span className="font-semibold text-[#242729]">{views}</span>
          <span className="text-[#9199a1]">views</span>
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/questions/${id}`}
          className="text-[17px] font-normal text-[#0074cc] hover:text-[#0a95ff] leading-snug block mb-1.5 transition-colors group-hover:text-[#0a95ff]"
        >
          {title}
        </Link>
        <p className="text-[13px] text-[#6a737c] leading-relaxed mb-2.5 line-clamp-2">
          {preview}
        </p>

        {/* Tags and Meta */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/questions/tagged/${tag.name}`}
                className="inline-flex items-center px-2 py-1 bg-[#e1ecf4] text-[#39739d] text-xs rounded hover:bg-[#d0e3f1] transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>

          {/* Author and Date */}
          <div className="flex items-center gap-1 text-xs text-[#6a737c]">
            <Link
              href={`/users/${author.pseudonym}`}
              className="text-[#0074cc] hover:text-[#0a95ff]"
            >
              {author.pseudonym || 'Anonymous'}
            </Link>
            <span className="font-bold text-[#6a737c]">{author.reputation}</span>
            <span>asked {timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
}
