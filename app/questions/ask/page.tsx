import { AskQuestionForm } from '@/components/questions/ask-question-form';
import { HelpCircle, Lightbulb } from 'lucide-react';

export default function AskQuestionPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-semibold text-[#242729]">Ask a public question</h1>

      {/* Tips Card */}
      <div className="bg-[#ebf4fb] border border-[#a6ceed] rounded-md p-6">
        <div className="flex gap-4">
          <Lightbulb className="w-6 h-6 text-[#0a95ff] flex-shrink-0 mt-1" />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[#242729]">
              Writing a good question
            </h2>
            <p className="text-sm text-[#3b4045]">
              You're ready to ask a programming-related question and this form will help guide you through the process.
            </p>
            <div className="text-sm text-[#3b4045] space-y-2">
              <p className="font-semibold">Steps:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Summarize your problem in a one-line title</li>
                <li>Describe your problem in more detail</li>
                <li>Describe what you tried and what you expected to happen</li>
                <li>Add "tags" which help surface your question to members of the community</li>
                <li>Review your question and post it to the site</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <AskQuestionForm />
    </div>
  );
}
