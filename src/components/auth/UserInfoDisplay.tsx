/**
 * UserInfoDisplay - Component for displaying user information
 * 
 * Features:
 * - Avatar with email initials
 * - Email display
 * - Logout button (only for sidebar variant)
 * - Responsive design for different variants
 * 
 * Variants:
 * - sidebar: For desktop sidebar with logout button
 * - mobile: For mobile profile page (logout handled separately)
 * 
 * MVP Simplifications:
 * - No display name (only email)
 * - No avatar URL (only initials)
 */

import React from 'react';
import LogoutButton from './LogoutButton';

interface UserInfoDisplayProps {
  user: {
    email: string;
  };
  variant: 'sidebar' | 'mobile';
}

export default function UserInfoDisplay({ user, variant }: UserInfoDisplayProps) {
  // Generate initials from email (first two letters before @)
  const getInitials = (email: string): string => {
    const username = email.split('@')[0];
    return username.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user.email);

  if (variant === 'sidebar') {
    return (
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-4">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {initials}
            </span>
          </div>
          
          {/* Email */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {user.email}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Twoje konto
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <LogoutButton variant="outline" size="sm" className="w-full" />
      </div>
    );
  }

  // Mobile variant (for profile page)
  return (
    <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
      {/* Avatar */}
      <div className="h-16 w-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xl font-semibold text-primary">
          {initials}
        </span>
      </div>
      
      {/* Email */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {user.email}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Użytkownik Foodnager
        </p>
      </div>
    </div>
  );
}

