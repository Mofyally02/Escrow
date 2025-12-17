import { z } from 'zod';

// E.164 phone number format: +[country code][number]
const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Phone must be in E.164 format (e.g., +1234567890)'),
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const emailOtpSchema = z.object({
  email_otp: z
    .string()
    .length(6, 'Email OTP must be 6 digits')
    .regex(/^\d{6}$/, 'Email OTP must contain only digits'),
});

export const phoneOtpSchema = z.object({
  phone_otp: z
    .string()
    .length(6, 'Phone OTP must be 6 digits')
    .regex(/^\d{6}$/, 'Phone OTP must contain only digits'),
});

export const verifyRegisterSchema = z.object({
  email_otp: z
    .string()
    .length(6, 'Email OTP must be 6 digits')
    .regex(/^\d{6}$/, 'Email OTP must contain only digits'),
  phone_otp: z
    .string()
    .length(6, 'Phone OTP must be 6 digits')
    .regex(/^\d{6}$/, 'Phone OTP must contain only digits'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type OTPFormData = z.infer<typeof otpSchema>;
export type VerifyRegisterFormData = z.infer<typeof verifyRegisterSchema>;

