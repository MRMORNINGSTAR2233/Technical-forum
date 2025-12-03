'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pseudonymSchema } from '@/lib/validations/auth';
import {
  createProfile,
  checkPseudonymAvailability,
} from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  pseudonym: pseudonymSchema,
});

type FormInput = z.infer<typeof formSchema>;

interface PseudonymSelectorProps {
  userId: string;
}

export function PseudonymSelector({ userId }: PseudonymSelectorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
  });

  const pseudonym = watch('pseudonym');

  const checkAvailability = async () => {
    if (!pseudonym || pseudonym.length < 3) return;

    setIsChecking(true);
    const available = await checkPseudonymAvailability(pseudonym);
    setIsAvailable(available);
    setIsChecking(false);
  };

  const onSubmit = async (data: FormInput) => {
    setIsLoading(true);
    setError(null);

    const result = await createProfile(userId, data.pseudonym);

    if ('error' in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Redirect to home
      router.push('/');
      router.refresh();
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    setError(null);

    // Set pseudonym as "Unknown" when skipping
    const result = await createProfile(userId, 'Unknown');

    if ('error' in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Redirect to home
      router.push('/');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pseudonym" className="text-sm font-semibold text-[#0c0d0e]">
          Pseudonym (Optional)
        </Label>
        <div className="flex gap-2">
          <Input
            id="pseudonym"
            type="text"
            placeholder="e.g., RedBird, CodeNinja, TechWizard"
            {...register('pseudonym')}
            disabled={isLoading}
            onBlur={checkAvailability}
            className="flex-1 border-gray-300 focus:border-[#0a95ff] focus:ring-[#0a95ff]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={checkAvailability}
            disabled={isChecking || !pseudonym}
            className="border-gray-300 hover:bg-gray-50"
          >
            {isChecking ? 'Checking...' : 'Check'}
          </Button>
        </div>
        {errors.pseudonym && (
          <p className="text-sm text-[#d1383d] flex items-center gap-1">
            <span>✗</span> {errors.pseudonym.message}
          </p>
        )}
        {isAvailable === true && (
          <p className="text-sm text-[#2f6f44] flex items-center gap-1">
            <span>✓</span> This pseudonym is available!
          </p>
        )}
        {isAvailable === false && (
          <p className="text-sm text-[#d1383d] flex items-center gap-1">
            <span>✗</span> This pseudonym is already taken
          </p>
        )}
        <p className="text-xs text-[#6a737c]">
          3-20 characters. Letters, numbers, and underscores only. You can set this later from your profile.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-[#fdf2f2] border border-[#f1aeb5] p-3">
          <p className="text-sm text-[#842029]">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          className="flex-1 border-gray-300 hover:bg-gray-50"
          disabled={isLoading}
        >
          Skip for now
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#0a95ff] hover:bg-[#0074cc] text-white font-medium py-2.5"
          disabled={isLoading || isAvailable === false}
        >
          {isLoading ? 'Creating...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
