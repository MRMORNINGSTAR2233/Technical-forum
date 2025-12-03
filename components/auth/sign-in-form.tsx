'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInInput } from '@/lib/validations/auth';
import { signIn } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn(data.email, data.password);
      // signIn will redirect on success
    } catch (_err) {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm font-semibold text-[#0c0d0e]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder=""
          {...register('email')}
          disabled={isLoading}
          className="border-gray-300 focus:border-[#6cbbf7] focus:ring-1 focus:ring-[#6cbbf7] text-sm py-2"
        />
        {errors.email && (
          <p className="text-xs text-[#d1383d]">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-semibold text-[#0c0d0e]">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-[#0074cc] hover:text-[#0a95ff]"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={isLoading}
          className="border-gray-300 focus:border-[#6cbbf7] focus:ring-1 focus:ring-[#6cbbf7] text-sm py-2"
        />
        {errors.password && (
          <p className="text-xs text-[#d1383d]">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-[#fdf2f2] border border-[#f1aeb5] p-2">
          <p className="text-xs text-[#842029]">{error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-[#0a95ff] hover:bg-[#0074cc] text-white font-normal py-2.5 text-sm" 
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Log in'}
      </Button>
    </form>
  );
}
