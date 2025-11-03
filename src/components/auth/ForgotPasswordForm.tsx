/**
 * ForgotPasswordForm - Password reset request form
 * 
 * Features:
 * - Single email field
 * - Client-side validation using Zod
 * - Loading state during submission
 * - Success state with message
 * - Link back to login
 * - Auto-redirect to login after 5 seconds on success
 * 
 * Following auth-spec.md US-001.7
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth.validation';

export default function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordInput>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ForgotPasswordInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    // Clear errors on change
    if (errors.email) {
      setErrors({});
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    // Client-side validation
    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ForgotPasswordInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof ForgotPasswordInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Call forgot password API endpoint
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle API errors
        const errorMessage = data.error?.message || 'Wystąpił błąd podczas wysyłania linku resetującego';
        setGeneralError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success! Show success message
      setSuccess(true);
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 5000);
    } catch (error) {
      console.error('Forgot password error:', error);
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
            Link wysłany!
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Sprawdź swoją skrzynkę email</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Jeśli konto z podanym adresem email istnieje, wysłaliśmy instrukcje resetowania hasła.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Przekierowanie do logowania za 5 sekund...
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            Wróć do logowania
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Main form
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Zapomniałeś hasła?</CardTitle>
        <CardDescription className="text-center">
          Podaj swój email, a wyślemy Ci link do resetowania hasła
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
              onChange={handleChange}
              disabled={isLoading}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoFocus
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.email}
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
                Wysyłanie...
              </>
            ) : (
              'Wyślij link resetujący'
            )}
          </Button>

          {/* Back to Login Link */}
          <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
            Pamiętasz hasło?{' '}
            <a href="/login" className="text-primary font-medium hover:underline">
              Wróć do logowania
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
