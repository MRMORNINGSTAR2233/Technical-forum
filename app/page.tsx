import Link from 'next/link';
import { getCurrentUser } from './actions/auth';
import { Button } from '@/components/ui/button';
import { QuestionFeed } from '@/components/questions/question-feed';
import { ArrowRight, MessageSquare, Users, Award } from 'lucide-react';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#242729]">
          Top Questions
        </h1>
        {user?.profile?.pseudonym && (
          <Link href="/questions/ask">
            <Button className="bg-[#0a95ff] hover:bg-[#0074cc]">
              Ask Question
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-300">
        <Link href="/?filter=interesting" className="px-3 py-2 text-sm text-gray-600 hover:text-[#242729] border-b-2 border-transparent hover:border-[#f48024] transition-colors">
          Interesting
        </Link>
        <Link href="/?filter=hot" className="px-3 py-2 text-sm text-gray-600 hover:text-[#242729] border-b-2 border-transparent hover:border-[#f48024] transition-colors">
          Hot
        </Link>
        <Link href="/?filter=week" className="px-3 py-2 text-sm text-gray-600 hover:text-[#242729] border-b-2 border-transparent hover:border-[#f48024] transition-colors">
          Week
        </Link>
        <Link href="/?filter=month" className="px-3 py-2 text-sm text-gray-600 hover:text-[#242729] border-b-2 border-transparent hover:border-[#f48024] transition-colors">
          Month
        </Link>
      </div>

      {user ? (
        <>
          {!user.profile?.pseudonym && (
            <div className="bg-[#fdf7e2] border border-[#e6cf7e] rounded p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm text-[#3b4045] font-medium mb-2">
                    Complete your profile setup
                  </p>
                  <p className="text-sm text-[#6a737c] mb-3">
                    Choose a pseudonym to start participating in the community
                  </p>
                  <Link href="/onboarding">
                    <Button size="sm" className="bg-[#0a95ff] hover:bg-[#0074cc]">
                      Choose Pseudonym
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Questions Feed */}
          <QuestionFeed filter="all" />
        </>
      ) : (
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white border border-gray-300 rounded-md p-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-[#242729] mb-4">
                Welcome to SMVITM Technical Forum
              </h2>
              <p className="text-lg text-[#6a737c] mb-6">
                A community-driven platform for students to ask questions, share knowledge, and help each other learn.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/sign-up">
                  <Button className="bg-[#0a95ff] hover:bg-[#0074cc] px-6">
                    Sign up
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" className="px-6">
                    Log in
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-300 rounded-md p-6">
              <MessageSquare className="w-8 h-8 text-[#0a95ff] mb-3" />
              <h3 className="font-semibold text-[#242729] mb-2">Ask Questions</h3>
              <p className="text-sm text-[#6a737c]">
                Get help from your peers on technical topics and coursework
              </p>
            </div>
            <div className="bg-white border border-gray-300 rounded-md p-6">
              <Users className="w-8 h-8 text-[#0a95ff] mb-3" />
              <h3 className="font-semibold text-[#242729] mb-2">Build Community</h3>
              <p className="text-sm text-[#6a737c]">
                Connect with fellow students and share your knowledge
              </p>
            </div>
            <div className="bg-white border border-gray-300 rounded-md p-6">
              <Award className="w-8 h-8 text-[#0a95ff] mb-3" />
              <h3 className="font-semibold text-[#242729] mb-2">Earn Reputation</h3>
              <p className="text-sm text-[#6a737c]">
                Gain reputation points by providing helpful answers
              </p>
            </div>
          </div>

          {/* Recent Questions Preview */}
          <div className="bg-white border border-gray-300 rounded-md p-6">
            <h3 className="text-xl font-semibold text-[#242729] mb-4">
              Recent Questions
            </h3>
            <QuestionFeed filter="all" />
            <div className="mt-4 text-center">
              <Link href="/questions" className="text-[#0a95ff] hover:text-[#0074cc] text-sm font-medium inline-flex items-center gap-1">
                View all questions
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
