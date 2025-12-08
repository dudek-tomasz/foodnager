/**
 * LogoutButton - Button component for user logout
 *
 * Features:
 * - Calls /api/auth/logout endpoint
 * - Loading state during logout
 * - Redirects to /login after successful logout
 * - Error handling with toast notifications
 * - Can be used in Sidebar (desktop) or Profile page (mobile)
 *
 * Props:
 * - variant: 'default' | 'ghost' | 'outline' - button style
 * - className: optional additional CSS classes
 * - showIcon: whether to show logout icon (default: true)
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline" | "destructive";
  className?: string;
  showIcon?: boolean;
}

export default function LogoutButton({ variant = "outline", className = "", showIcon = true }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Call logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle API errors
        const errorMessage = data.error?.message || "Nie udało się wylogować";
        toast.error(errorMessage);
        return;
      }

      // Success! Show toast and redirect to login
      toast.success("Wylogowano pomyślnie");

      // Small delay for toast to be visible
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Nie udało się połączyć z serwerem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogout} variant={variant} disabled={isLoading} className={className}>
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Wylogowywanie...
        </>
      ) : (
        <>
          {showIcon && <span className="mr-2">🚪</span>}
          Wyloguj się
        </>
      )}
    </Button>
  );
}
