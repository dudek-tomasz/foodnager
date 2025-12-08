/**
 * Authentication validation schemas
 *
 * Zod schemas for validating authentication forms (login, register, password reset)
 * Following MVP simplifications from auth-spec.md:
 * - No "remember me" checkbox
 * - No "terms accepted" checkbox
 * - Email verification optional (user can login without verification)
 */

import { z } from "zod";

// Schema for login (MVP - simplified, no remember)
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Schema for registration (MVP - no termsAccepted)
export const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są zgodne",
    path: ["passwordConfirm"],
  });

// Schema for forgot password
export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
});

// Schema for reset password
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token jest wymagany"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są zgodne",
    path: ["passwordConfirm"],
  });

// TypeScript types for validation
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
