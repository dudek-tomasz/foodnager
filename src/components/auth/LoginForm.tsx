/**
 * LoginForm - Authentication form for user login
 * 
 * Features:
 * - Email and password fields
 * - Client-side validation using Zod
 * - Loading state during submission
 * - Error handling
 * - Links to register and forgot password
 * - Responsive design with Shadcn/ui components
 * 
 * MVP Simplifications:
 * - No "Remember Me" checkbox
 * - Email verification optional (user can login without verification)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, type LoginInput } from '@/lib/validations/auth.validation';

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = '/fridge' }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = (field: keyof LoginInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear general error on change
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    // Client-side validation
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof LoginInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to /api/auth/login
      console.log('Login with:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // On success, redirect
      // window.location.href = redirectTo;
      
      // For now, show success message
      setGeneralError('Funkcja logowania będzie dostępna po implementacji backendu');
    } catch (error) {
      setGeneralError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Logowanie</CardTitle>
        <CardDescription className="text-center">
          Zaloguj się do swojego konta Foodnager
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* General Error */}
          {generalError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900">
              {generalError}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.pl"
              value={formData.email}
              onChange={handleChange('email')}
              disabled={isLoading}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
                tabIndex={-1}
              >
                Zapomniałeś hasła?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange('password')}
              disabled={isLoading}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-6">
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Logowanie...
              </>
            ) : (
              'Zaloguj się'
            )}
          </Button>

          {/* Register Link */}
          <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
            Nie masz konta?{' '}
            <a href="/register" className="text-primary font-medium hover:underline">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

