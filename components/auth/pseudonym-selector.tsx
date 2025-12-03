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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pseudonym">Choose your pseudonym</Label>
        <div className="flex gap-2">
          <Input
            id="pseudonym"
            type="text"
            placeholder="RedBird"
            {...register('pseudonym')}
            disabled={isLoading}
            onBlur={checkAvailability}
          />
          <Button
            type="button"
            variant="outline"
            onClick={checkAvailability}
            disabled={isChecking || !pseudonym}
          >
            {isChecking ? 'Checking...' : 'Check'}
          </Button>
        </div>
        {errors.pseudonym && (
          <p className="text-sm text-red-600">{errors.pseudonym.message}</p>
        )}
        {isAvailable === true && (
          <p className="text-sm text-green-600">✓ Pseudonym is available</p>
        )}
        {isAvailable === false && (
          <p className="text-sm text-red-600">✗ Pseudonym is already taken</p>
        )}
        <p className="text-xs text-gray-500">
          Your pseudonym will be your public identity on the forum. Choose
          wisely!
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || isAvailable === false}
      >
        {isLoading ? 'Creating profile...' : 'Continue'}
      </Button>
    </form>
  );
}
