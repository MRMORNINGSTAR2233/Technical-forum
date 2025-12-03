import { getRecentFAQs } from '@/app/actions/faq';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export async function AIFAQWidget() {
  const faqs = await getRecentFAQs(5);

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-[#3b4045]">AI FAQ Corner</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {faqs.map((faq, index) => (
          <div key={faq.id} className="group">
            <div className="flex gap-2">
              <span className="text-sm font-semibold text-gray-400 flex-shrink-0">
                {index + 1}.
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#242729] mb-1 leading-snug">
                  {faq.question}
                </p>
                <p className="text-xs text-[#6a737c] line-clamp-2 mb-2 leading-relaxed">
                  {faq.answer}
                </p>
                {faq.topic && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {faq.topic.split(',').slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 bg-[#e1ecf4] text-[#39739d] text-xs rounded hover:bg-[#d0e3f1] transition-colors"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {faq.sourceQuestionId && (
                  <Link
                    href={`/questions/${faq.sourceQuestionId}`}
                    className="text-xs text-[#0a95ff] hover:text-[#0074cc] transition-colors"
                  >
                    View original question →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#f8f9f9] border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-[#6a737c] italic flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI-generated from community Q&A
        </p>
      </div>
    </div>
  );
}
