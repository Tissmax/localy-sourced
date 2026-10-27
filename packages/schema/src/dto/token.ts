import { z } from 'zod';
import { UserResponseSchema } from './user';

export const RefreshResponseSchema = z.object({ refreshToken: z.string().min(20).max(200), user: UserResponseSchema });
export type RefreshResponseType = z.infer<typeof RefreshResponseSchema>;

export const LoginResponseSchema = z.object({ accessToken: z.string().min(20).max(200), refreshToken: z.string().min(20).max(200) });
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;

export const RefreshSchema = z.object({ refreshToken: z.string().min(20).max(200) });
export type RefreshType = z.infer<typeof RefreshSchema>;