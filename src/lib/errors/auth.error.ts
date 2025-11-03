/**
 * Authentication Error Classes
 * 
 * Custom error classes for authentication operations in Foodnager.
 * Following auth-spec.md MVP simplifications:
 * - EMAIL_NOT_VERIFIED removed (optional email verification for MVP)
 */

/**
 * Base Authentication Error
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error codes
 * MVP: EMAIL_NOT_VERIFIED removed - user can login without email verification
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'REGISTRATION_FAILED'
  | 'LOGOUT_FAILED'
  | 'FORGOT_PASSWORD_FAILED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'RESET_PASSWORD_FAILED'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED';

/**
 * Factory functions for common auth errors
 */
export const AuthErrors = {
  /**
   * 401 - Invalid email or password during login
   */
  invalidCredentials: (message = 'Nieprawidłowy email lub hasło') =>
    new AuthError(message, 'INVALID_CREDENTIALS', 401),

  /**
   * 409 - Email already registered
   */
  emailAlreadyExists: (message = 'Ten email jest już zarejestrowany') =>
    new AuthError(message, 'EMAIL_ALREADY_EXISTS', 409),

  /**
   * 400 - Registration failed
   */
  registrationFailed: (message = 'Rejestracja nie powiodła się') =>
    new AuthError(message, 'REGISTRATION_FAILED', 400),

  /**
   * 400 - Logout failed
   */
  logoutFailed: (message = 'Wylogowanie nie powiodło się') =>
    new AuthError(message, 'LOGOUT_FAILED', 400),

  /**
   * 400 - Forgot password operation failed
   */
  forgotPasswordFailed: (message = 'Nie udało się wysłać linku resetującego hasło') =>
    new AuthError(message, 'FORGOT_PASSWORD_FAILED', 400),

  /**
   * 400 - Invalid or expired reset token
   */
  invalidToken: (message = 'Token jest nieprawidłowy lub wygasł') =>
    new AuthError(message, 'INVALID_TOKEN', 400),

  /**
   * 400 - Reset password failed
   */
  resetPasswordFailed: (message = 'Zmiana hasła nie powiodła się') =>
    new AuthError(message, 'RESET_PASSWORD_FAILED', 400),

  /**
   * 401 - Session expired
   */
  sessionExpired: (message = 'Sesja wygasła. Zaloguj się ponownie.') =>
    new AuthError(message, 'SESSION_EXPIRED', 401),

  /**
   * 401 - Unauthorized access
   */
  unauthorized: (message = 'Brak dostępu. Zaloguj się.') =>
    new AuthError(message, 'UNAUTHORIZED', 401),
};

/**
 * Check if error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Map Supabase auth errors to our AuthError
 */
export function mapSupabaseAuthError(error: { message: string; status?: number }): AuthError {
  const message = error.message.toLowerCase();

  // Invalid credentials (wrong password, user not found)
  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid password') ||
    message.includes('email not confirmed')
  ) {
    return AuthErrors.invalidCredentials();
  }

  // Email already exists
  if (
    message.includes('user already registered') ||
    message.includes('email already exists')
  ) {
    return AuthErrors.emailAlreadyExists();
  }

  // Invalid or expired token
  if (
    message.includes('invalid token') ||
    message.includes('token expired') ||
    message.includes('otp expired')
  ) {
    return AuthErrors.invalidToken();
  }

  // Session expired
  if (message.includes('refresh_token_not_found') || message.includes('session expired')) {
    return AuthErrors.sessionExpired();
  }

  // Default to generic auth error
  return new AuthError(
    'Wystąpił błąd podczas uwierzytelniania',
    'UNAUTHORIZED',
    error.status || 400
  );
}

