/**
 * UserInfoDisplay - Component for displaying user info with logout option
 *
 * Following auth-spec.md MVP specifications:
 * - Display avatar (initials from email)
 * - Display email
 * - Logout button (only for variant="sidebar")
 * - Two variants: sidebar (desktop) and mobile (profile page)
 *
 * MVP Simplifications:
 * - No avatar upload
 * - No display name (uses email only)
 * - Simple design
 */

import React from "react";
import LogoutButton from "./LogoutButton";

interface UserInfoDisplayProps {
  user: {
    email: string;
  };
  variant: "sidebar" | "mobile";
}

export default function UserInfoDisplay({ user, variant }: UserInfoDisplayProps) {
  // Get initials from email (first letter before @)
  const initials = user.email.charAt(0).toUpperCase();

  if (variant === "sidebar") {
    // Desktop sidebar variant
    return (
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3 mb-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{initials}</span>
          </div>
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Użytkownik</p>
          </div>
        </div>
        {/* Logout Button */}
        <LogoutButton variant="outline" className="w-full text-sm" showIcon={true} />
      </div>
    );
  }

  // Mobile variant (for profile page - but ProfileView handles this now)
  return (
    <div className="flex items-center space-x-4">
      {/* Avatar */}
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">{initials}</span>
      </div>
      {/* User Info */}
      <div>
        <p className="text-lg font-medium">{user.email}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Użytkownik Foodnager</p>
      </div>
    </div>
  );
}
