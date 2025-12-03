'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth';
import { signUp } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    setError(null);

    const result = await signUp(data.email, data.password);

    if ('error' in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Redirect to pseudonym selection
      router.push('/onboarding');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-[#0c0d0e]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="yourname@sode-edu.in"
          {...register('email')}
          disabled={isLoading}
          className="border-gray-300 focus:border-[#0a95ff] focus:ring-[#0a95ff]"
        />
        <p className="text-xs text-[#6a737c]">
          Must be a valid @sode-edu.in email address
        </p>
        {errors.email && (
          <p className="text-sm text-[#d1383d] flex items-center gap-1">
            <span>✗</span> {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-[#0c0d0e]">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={isLoading}
          className="border-gray-300 focus:border-[#0a95ff] focus:ring-[#0a95ff]"
        />
        <p className="text-xs text-[#6a737c]">
          Minimum 6 characters
        </p>
        {errors.password && (
          <p className="text-sm text-[#d1383d] flex items-center gap-1">
            <span>✗</span> {errors.password.message}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-[#fdf2f2] border border-[#f1aeb5] p-3">
          <p className="text-sm text-[#842029]">{error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-[#0a95ff] hover:bg-[#0074cc] text-white font-medium py-2.5" 
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Sign up'}
      </Button>
    </form>
  );
}
