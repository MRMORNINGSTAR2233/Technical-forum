import { getUserByPseudonym } from '@/app/actions/users';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Award, CheckCircle, Calendar, Clock, TrendingUp } from 'lucide-react';

interface UserProfilePageProps {
  params: Promise<{
    pseudonym: string;
  }>;
}

export async function generateMetadata({ params }: UserProfilePageProps) {
  const { pseudonym: paramPseudonym } = await params;
  const pseudonym = decodeURIComponent(paramPseudonym);
  return {
    title: `User ${pseudonym} - SMVITM Tech Forum`,
    description: `View ${pseudonym}'s profile, questions, and answers`,
  };
}

function calculateMemberDuration(createdAt: Date): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { pseudonym: paramPseudonym } = await params;
  const pseudonym = decodeURIComponent(paramPseudonym);
  const user = await getUserByPseudonym(pseudonym);

  if (!user) {
    notFound();
  }

  const memberSince = new Date(user.createdAt);
  const memberDuration = calculateMemberDuration(user.createdAt);

  return (
    <div className="space-y-4">
      {/* User Header Card */}
      <div className="bg-white border border-gray-300 rounded-md p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 bg-[#0a95ff] rounded flex items-center justify-center text-white text-5xl font-bold flex-shrink-0">
            {(user.pseudonym || 'A').charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-normal text-[#242729]">
                {user.pseudonym || 'Anonymous'}
              </h1>
              {user.role === 'MODERATOR' && (
                <span className="px-2 py-1 bg-[#0a95ff] text-white text-xs font-semibold rounded">
                  ♦ Moderator
                </span>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1 text-[#6a737c]">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">
                  <span className="font-bold text-[#242729]">{user.reputation.toLocaleString()}</span> reputation
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#6a737c]">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Member for {memberDuration < 1 ? 'today' : `${memberDuration} day${memberDuration !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#6a737c]">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Last seen {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-normal text-[#242729]">{user.questionCount}</div>
                <div className="text-xs text-[#6a737c]">questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-normal text-[#242729]">{user.answerCount}</div>
                <div className="text-xs text-[#6a737c]">answers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex gap-2">
          <button className="px-3 py-2 text-sm text-[#242729] border-b-2 border-[#f48024] font-medium">
            Profile
          </button>
          <button className="px-3 py-2 text-sm text-[#6a737c] hover:text-[#242729] border-b-2 border-transparent">
            Activity
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-300 rounded-md p-4">
          <h3 className="text-sm font-semibold text-[#6a737c] mb-2">Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6a737c]">reputation</span>
              <span className="font-semibold text-[#242729]">{user.reputation.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6a737c]">reached</span>
              <span className="font-semibold text-[#242729]">~0 people</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6a737c]">answers</span>
              <span className="font-semibold text-[#242729]">{user.answerCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6a737c]">questions</span>
              <span className="font-semibold text-[#242729]">{user.questionCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-md p-4">
          <h3 className="text-sm font-semibold text-[#6a737c] mb-2">About</h3>
          <div className="space-y-2 text-sm text-[#6a737c]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Member since {memberSince.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{user.role === 'MODERATOR' ? 'Moderator' : 'Student'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-white border border-gray-300 rounded-md">
        <div className="border-b border-gray-300 px-4 py-3">
          <h2 className="text-lg font-semibold text-[#242729]">
            {user.questionCount} Questions
          </h2>
        </div>
        <div className="p-4">
          {user.questions.length === 0 ? (
            <div className="text-center py-8 text-[#6a737c]">
              No questions yet
            </div>
          ) : (
            <div className="space-y-3">
              {user.questions.map((question) => (
                <div key={question.id} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                  <Link
                    href={`/questions/${question.id}`}
                    className="text-[#0074cc] hover:text-[#0a95ff] font-normal text-[15px] block mb-1"
                  >
                    {question.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-[#6a737c]">
                    <span className="font-semibold">{question.voteScore} votes</span>
                    <span className={question.answerCount > 0 ? 'text-[#2f6f44] font-semibold' : ''}>
                      {question.answerCount} answers
                    </span>
                    <span>{question.views} views</span>
                    <span>asked {new Date(question.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Answers Section */}
      <div className="bg-white border border-gray-300 rounded-md">
        <div className="border-b border-gray-300 px-4 py-3">
          <h2 className="text-lg font-semibold text-[#242729]">
            {user.answerCount} Answers
          </h2>
        </div>
        <div className="p-4">
          {user.answers.length === 0 ? (
            <div className="text-center py-8 text-[#6a737c]">
              No answers yet
            </div>
          ) : (
            <div className="space-y-3">
              {user.answers.map((answer) => (
                <div key={answer.id} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-start gap-2 mb-1">
                    <Link
                      href={`/questions/${answer.question.id}`}
                      className="text-[#0074cc] hover:text-[#0a95ff] font-normal text-[15px] flex-1"
                    >
                      {answer.question.title}
                    </Link>
                    {answer.isAccepted && (
                      <CheckCircle className="w-4 h-4 text-[#2f6f44] flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#6a737c]">
                    <span className="font-semibold">{answer.voteScore} votes</span>
                    {answer.isAccepted && (
                      <span className="text-[#2f6f44] font-semibold">✓ accepted</span>
                    )}
                    <span>answered {new Date(answer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
