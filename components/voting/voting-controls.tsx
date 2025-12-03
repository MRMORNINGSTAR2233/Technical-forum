'use client';

import { useState, useEffect, useTransition } from 'react';
import { voteOnQuestion, voteOnAnswer, getUserVote } from '@/app/actions/votes';
import { useRouter } from 'next/navigation';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';

interface VotingControlsProps {
  targetId: string;
  targetType: 'question' | 'answer';
  initialScore: number;
  isOwnPost?: boolean;
  isAuthenticated?: boolean;
}

export function VotingControls({
  targetId,
  targetType,
  initialScore,
  isOwnPost = false,
  isAuthenticated = false,
}: VotingControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user's existing vote
    if (isAuthenticated && !isOwnPost) {
      getUserVote(targetId, targetType).then((vote) => {
        if (vote) {
          setUserVote(vote.value);
        }
      });
    }
  }, [targetId, targetType, isAuthenticated, isOwnPost]);

  const handleVote = async (value: 1 | -1) => {
    if (!isAuthenticated) {
      setError('You must be logged in to vote');
      return;
    }

    if (isOwnPost) {
      setError('You cannot vote on your own posts');
      return;
    }

    setError(null);

    // Optimistic update
    const previousScore = score;
    const previousVote = userVote;
    
    // Calculate optimistic score
    let optimisticScore = score;
    if (userVote === value) {
      // Removing vote
      optimisticScore -= value;
      setUserVote(null);
    } else if (userVote !== null) {
      // Changing vote
      optimisticScore = optimisticScore - userVote + value;
      setUserVote(value);
    } else {
      // New vote
      optimisticScore += value;
      setUserVote(value);
    }
    setScore(optimisticScore);

    startTransition(async () => {
      try {
        const result =
          targetType === 'question'
            ? await voteOnQuestion(targetId, value)
            : await voteOnAnswer(targetId, value);

        if ('error' in result) {
          // Revert optimistic update
          setScore(previousScore);
          setUserVote(previousVote);
          setError(result.error);
        } else {
          // Update with actual score from server
          setScore(result.newScore);
          router.refresh();
        }
      } catch (err) {
        // Revert optimistic update
        setScore(previousScore);
        setUserVote(previousVote);
        setError('Failed to vote. Please try again.');
      }
    });
  };

  const disabled = !isAuthenticated || isOwnPost || isPending;

  return (
    <div className="flex flex-col items-center gap-1 min-w-[40px]">
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={disabled}
        className={`p-1 rounded-full transition-all duration-150 ${
          userVote === 1
            ? 'text-[#f48024] bg-[#fdf2e5]'
            : 'text-[#9199a1] hover:bg-[#f1f2f3] hover:text-[#525960]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
        aria-label="Upvote"
        title={!isAuthenticated ? 'Login to vote' : isOwnPost ? 'Cannot vote on own post' : 'This question shows research effort; it is useful and clear'}
      >
        <ArrowBigUp 
          className="w-9 h-9" 
          fill={userVote === 1 ? 'currentColor' : 'none'} 
          strokeWidth={1.5}
        />
      </button>
      
      <span 
        className={`text-[21px] font-normal ${
          score > 0 ? 'text-[#0c0d0e]' : score < 0 ? 'text-[#d1383d]' : 'text-[#6a737c]'
        }`} 
        aria-live="polite"
      >
        {score}
      </span>
      
      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={disabled}
        className={`p-1 rounded-full transition-all duration-150 ${
          userVote === -1
            ? 'text-[#d1383d] bg-[#fdf2f2]'
            : 'text-[#9199a1] hover:bg-[#f1f2f3] hover:text-[#525960]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
        aria-label="Downvote"
        title={!isAuthenticated ? 'Login to vote' : isOwnPost ? 'Cannot vote on own post' : 'This question does not show any research effort; it is unclear or not useful'}
      >
        <ArrowBigDown 
          className="w-9 h-9" 
          fill={userVote === -1 ? 'currentColor' : 'none'}
          strokeWidth={1.5}
        />
      </button>
      
      {error && (
        <div className="text-[11px] text-[#d1383d] text-center mt-1 max-w-[120px] px-2 py-1 bg-[#fdf2f2] rounded" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
