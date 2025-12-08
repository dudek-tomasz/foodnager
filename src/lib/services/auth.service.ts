/**
 * Authentication Service
 *
 * Centralized authentication logic using Supabase Auth.
 * Following auth-spec.md and MVP simplifications:
 * - Email verification optional (user can login without clicking verification link)
 * - No "remember me" functionality (sessions persist by default)
 * - Uses @supabase/ssr for proper SSR support
 *
 * IMPORTANT: This service should be used server-side only (API routes, Astro pages)
 */

import type { User, Session } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { AuthErrors, mapSupabaseAuthError } from "@/lib/errors/auth.error";

// ============================================================================
// Types
// ============================================================================

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface AuthServiceContext {
  cookies: AstroCookies;
  headers: Headers;
}

// ============================================================================
// Auth Service Implementation
// ============================================================================

export class AuthService {
  /**
   * Login user with email and password
   * MVP: Email verification is optional - user can login without clicking verification link
   */
  async login(email: string, password: string, context: AuthServiceContext): Promise<AuthResponse> {
    const supabase = createSupabaseServerInstance(context);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw mapSupabaseAuthError(error);
    }

    if (!data.user || !data.session) {
      throw AuthErrors.invalidCredentials();
    }

    // MVP: No email verification check
    // In future, can add:
    // if (!data.user.email_confirmed_at) {
    //   throw AuthErrors.emailNotVerified();
    // }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Register new user with email and password
   * Supabase will send verification email automatically
   * MVP: User can login without clicking verification link
   */
  async register(email: string, password: string, context: AuthServiceContext): Promise<AuthResponse> {
    const supabase = createSupabaseServerInstance(context);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${import.meta.env.PUBLIC_APP_URL}/api/auth/verify`,
      },
    });

    if (error) {
      // Check for duplicate email
      if (error.message.toLowerCase().includes("already registered")) {
        throw AuthErrors.emailAlreadyExists();
      }
      throw mapSupabaseAuthError(error);
    }

    if (!data.user || !data.session) {
      throw AuthErrors.registrationFailed("Nie udało się utworzyć konta");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Logout current user
   * Clears session and removes cookies
   */
  async logout(context: AuthServiceContext): Promise<void> {
    const supabase = createSupabaseServerInstance(context);

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw AuthErrors.logoutFailed(error.message);
    }
  }

  /**
   * Send password reset email
   * Always returns success (security best practice - don't reveal if email exists)
   */
  async forgotPassword(email: string, context: AuthServiceContext): Promise<void> {
    const supabase = createSupabaseServerInstance(context);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.PUBLIC_APP_URL}/reset-password`,
    });

    // Don't throw error if email not found (security best practice)
    if (error && !error.message.toLowerCase().includes("not found")) {
      throw AuthErrors.forgotPasswordFailed(error.message);
    }
  }

  /**
   * Reset password using token from email
   */
  async resetPassword(token: string, newPassword: string, context: AuthServiceContext): Promise<void> {
    const supabase = createSupabaseServerInstance(context);

    // First verify the token
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });

    if (verifyError) {
      throw AuthErrors.invalidToken("Token jest nieprawidłowy lub wygasł");
    }

    // Then update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw AuthErrors.resetPasswordFailed(updateError.message);
    }
  }

  /**
   * Get current session
   */
  async getSession(context: AuthServiceContext): Promise<Session | null> {
    const supabase = createSupabaseServerInstance(context);
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Get current user
   */
  async getUser(context: AuthServiceContext): Promise<User | null> {
    const supabase = createSupabaseServerInstance(context);
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(context: AuthServiceContext): Promise<boolean> {
    const session = await this.getSession(context);
    return session !== null;
  }

  /**
   * Refresh session (extend expiry)
   */
  async refreshSession(context: AuthServiceContext): Promise<Session | null> {
    const supabase = createSupabaseServerInstance(context);
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return null;
    }

    return data.session;
  }

  /**
   * Verify email with token (callback from email link)
   */
  async verifyEmail(token: string, context: AuthServiceContext): Promise<void> {
    const supabase = createSupabaseServerInstance(context);

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email",
    });

    if (error) {
      throw AuthErrors.invalidToken("Link weryfikacyjny jest nieprawidłowy lub wygasł");
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
