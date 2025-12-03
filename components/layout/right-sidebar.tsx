import { ModerationWidget } from '@/components/moderation/moderation-widget';
import { HotQuestionsWidget } from '@/components/hot-questions/hot-questions-widget';
import { AIFAQWidget } from '@/components/faq/ai-faq-widget';
import { Lightbulb } from 'lucide-react';

export async function RightSidebar() {
  return (
    <aside className="hidden xl:block w-[300px] pt-6 sticky top-[50px] h-[calc(100vh-50px)] overflow-y-auto">
      <div className="px-4 space-y-4">
        {/* The Overflow Blog */}
        <div className="bg-[#fdf7e2] border border-[#f1e5bc] rounded-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[#f48024]" />
            <h3 className="text-xs font-bold text-[#3b4045] uppercase tracking-wide">
              The Overflow Blog
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            <a href="#" className="block text-[#3b4045] hover:text-[#0a95ff] transition-colors">
              Best practices for technical documentation
            </a>
            <a href="#" className="block text-[#3b4045] hover:text-[#0a95ff] transition-colors">
              How to write better code reviews
            </a>
          </div>
        </div>

        {/* Hot Network Questions Widget */}
        <HotQuestionsWidget />

        {/* AI FAQ Corner Widget */}
        <AIFAQWidget />

        {/* Moderation Queue Widget (Moderators only) */}
        <ModerationWidget />

        {/* Community Stats */}
        <div className="bg-white border border-gray-300 rounded-md shadow-sm">
          <div className="bg-[#f8f9f9] border-b border-gray-300 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#3b4045]">
              Community Stats
            </h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#6a737c]">Questions</span>
              <span className="font-semibold text-[#242729]">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6a737c]">Answers</span>
              <span className="font-semibold text-[#242729]">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6a737c]">Users</span>
              <span className="font-semibold text-[#242729]">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6a737c]">Tags</span>
              <span className="font-semibold text-[#242729]">0</span>
            </div>
          </div>
        </div>

        {/* Featured Tags */}
        <div className="bg-white border border-gray-300 rounded-md shadow-sm">
          <div className="bg-[#f8f9f9] border-b border-gray-300 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#3b4045]">
              Featured Tags
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 bg-[#e1ecf4] text-[#39739d] text-xs rounded hover:bg-[#d0e3f1] transition-colors cursor-pointer">
                javascript
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-[#e1ecf4] text-[#39739d] text-xs rounded hover:bg-[#d0e3f1] transition-colors cursor-pointer">
                python
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-[#e1ecf4] text-[#39739d] text-xs rounded hover:bg-[#d0e3f1] transition-colors cursor-pointer">
                react
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-[#e1ecf4] text-[#39739d] text-xs rounded hover:bg-[#d0e3f1] transition-colors cursor-pointer">
                java
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
