/**
 * RegisterForm - User registration form
 * 
 * Features:
 * - Email, password, and password confirmation fields
 * - Client-side validation using Zod
 * - Password strength requirements display
 * - Loading state during submission
 * - Error handling
 * - Success state with message
 * - Link to login page
 * 
 * MVP Simplifications:
 * - No "Terms & Conditions" checkbox
 * - Email verification optional (user can login without clicking verification link)
 * - Simplified success message
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth.validation';

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterInput>({
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof RegisterInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Call register API endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle API errors
        const errorMessage = data.error?.message || 'Wystąpił błąd podczas rejestracji';
        setGeneralError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success! Show success message
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError('Nie udało się połączyć z serwerem. Spróbuj ponownie.');
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-green-600 dark:text-green-400">
            Rejestracja udana!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Konto zostało utworzone!</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Możesz się teraz zalogować.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Wysłaliśmy email weryfikacyjny na Twój adres (opcjonalny).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            Przejdź do logowania
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Main form
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Rejestracja</CardTitle>
        <CardDescription className="text-center">
          Utwórz nowe konto w Foodnager
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
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange('password')}
              disabled={isLoading}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error password-requirements' : 'password-requirements'}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
            <p id="password-requirements" className="text-xs text-neutral-500 dark:text-neutral-400">
              Minimum 8 znaków, wielka litera, mała litera i cyfra
            </p>
          </div>

          {/* Password Confirm Field */}
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Powtórz hasło</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={handleChange('passwordConfirm')}
              disabled={isLoading}
              className={errors.passwordConfirm ? 'border-red-500 focus-visible:ring-red-500' : ''}
              aria-invalid={!!errors.passwordConfirm}
              aria-describedby={errors.passwordConfirm ? 'passwordConfirm-error' : undefined}
            />
            {errors.passwordConfirm && (
              <p id="passwordConfirm-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.passwordConfirm}
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
                Rejestrowanie...
              </>
            ) : (
              'Zarejestruj się'
            )}
          </Button>

          {/* Login Link */}
          <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
            Masz już konto?{' '}
            <a href="/login" className="text-primary font-medium hover:underline">
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

