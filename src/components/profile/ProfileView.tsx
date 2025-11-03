/**
 * ProfileView - Main profile page component
 * 
 * Features:
 * - User information display
 * - Account creation date
 * - Logout button (for mobile)
 * - Clean card-based layout
 * 
 * MVP Simplifications:
 * - No statistics (recipes count, products count, etc.)
 * - No avatar upload
 * - No display name editing
 * - No password change (can be added later)
 * 
 * Future enhancements:
 * - Statistics section
 * - Password change form
 * - Avatar upload
 * - Display name editing
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserInfoDisplay from '@/components/auth/UserInfoDisplay';
import LogoutButton from '@/components/auth/LogoutButton';

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
}

export default function ProfileView({ user }: ProfileViewProps) {
  // Format creation date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Mój profil</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Zarządzaj swoim kontem Foodnager
          </p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informacje o koncie</CardTitle>
            <CardDescription>
              Twoje podstawowe dane użytkownika
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Display */}
            <UserInfoDisplay user={user} variant="mobile" />

            {/* Account Details */}
            <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    ID użytkownika
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                    {user.id}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Data rejestracji
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Akcje konta</CardTitle>
            <CardDescription>
              Zarządzaj swoim kontem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Logout Button (Mobile) */}
            <div className="lg:hidden">
              <LogoutButton variant="destructive" className="w-full" />
            </div>

            {/* Desktop - info that logout is in sidebar */}
            <div className="hidden lg:block">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Przycisk wylogowania znajduje się w panelu bocznym.
              </p>
            </div>

            {/* Future: Password change button */}
            {/* <Button variant="outline" className="w-full">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Zmień hasło
            </Button> */}
          </CardContent>
        </Card>

        {/* Future: Statistics Card */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Twoje statystyki</CardTitle>
            <CardDescription>
              Podsumowanie Twojej aktywności
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <p className="text-2xl font-bold text-primary">{stats.recipesCount}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Przepisów</p>
              </div>
              <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <p className="text-2xl font-bold text-primary">{stats.productsCount}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Produktów</p>
              </div>
              <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <p className="text-2xl font-bold text-primary">{stats.cookingHistoryCount}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Ugotowano</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}

