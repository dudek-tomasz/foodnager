/**
 * ProfileView - User profile page component
 *
 * MVP Features (auth-spec.md):
 * - Display user email
 * - Display account creation date
 * - Logout button (for mobile - US-001.6)
 * - Simple, clean design
 *
 * Post-MVP (can be added later):
 * - Statistics (recipe count, products count, cooking history)
 * - Avatar upload
 * - Display name
 * - Password change
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/auth/LogoutButton";

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
}

export default function ProfileView({ user }: ProfileViewProps) {
  // Format creation date
  const createdDate = new Date(user.createdAt);
  const formattedDate = createdDate.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profil</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Zarządzaj swoim kontem Foodnager</p>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-4">
            {/* Avatar - initials from email */}
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{user.email.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <CardTitle className="text-xl">{user.email}</CardTitle>
              <CardDescription>Użytkownik Foodnager</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Email</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Konto utworzone</span>
              <span className="text-sm">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ID użytkownika</span>
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-500">
                {user.id.split("-")[0]}...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zarządzaj kontem</CardTitle>
          <CardDescription>Akcje związane z Twoim kontem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Logout Button */}
          <LogoutButton variant="destructive" className="w-full" showIcon={true} />
        </CardContent>
      </Card>

      {/* Info Box - MVP Notice */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          💡 <strong>Planowane funkcje:</strong> W przyszłości będziesz mógł dodać zdjęcie profilowe, zmienić hasło oraz
          zobaczyć statystyki swojej kuchennej aktywności.
        </p>
      </div>
    </div>
  );
}
