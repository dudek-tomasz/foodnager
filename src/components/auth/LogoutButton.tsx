/**
 * LogoutButton - Button component for logging out
 * 
 * Features:
 * - Calls logout API endpoint
 * - Loading state during logout
 * - Error handling
 * - Redirect to login after successful logout
 * - Can be used in ProfileView (mobile) or UserInfoDisplay (desktop)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function LogoutButton({ 
  variant = 'outline', 
  size = 'default',
  className = '' 
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to /api/auth/logout
      console.log('Logging out...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // On success, redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
      // Optionally show toast error
      alert('Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Wylogowywanie...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Wyloguj się
        </>
      )}
    </Button>
  );
}

