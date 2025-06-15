
import * as z from 'zod';

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
export type AuthFormValues = z.infer<typeof authSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
