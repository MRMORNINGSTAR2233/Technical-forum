import { QuestionDetailView } from '@/components/questions/question-detail-view';

interface QuestionPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { id } = await params;
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <QuestionDetailView questionId={id} />
    </div>
  );
}
