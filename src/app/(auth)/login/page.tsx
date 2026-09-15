'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Login failed');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full border border-slate-200 bg-white p-2 shadow-lg rounded-2xl">
        <CardHeader className="space-y-2 text-center pt-6 pb-2">
          <div className="mx-auto flex justify-center mb-1">
            <div className="h-16 w-16 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              SV
            </div>
          </div>

          <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
            SRI VAISHNAVI TRADERS
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 font-medium">
            Plumbing & Sanitary Industrial Billing System
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 px-6 pt-4">
            {error && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter operator username"
                {...register('username')}
                className={`bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus-visible:ring-blue-600 focus-visible:border-blue-600 ${
                  errors.username ? 'border-rose-500' : ''
                }`}
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-xs text-rose-600">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  {...register('password')}
                  className={`bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus-visible:ring-blue-600 focus-visible:border-blue-600 pr-10 ${
                    errors.password ? 'border-rose-500' : ''
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-2 pb-6 px-6">
            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck size={16} />
                  Sign In
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

