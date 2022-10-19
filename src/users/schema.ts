import { z } from 'zod';

export const UserInputSchema = z.object({
  email: z.string().email(),
  username: z.string(),
  password: z.string(),
});

export const UserResponseSchema = z.object({
  email: z.string().email(),
  username: z.string(),
});

export const GetUserParamsSchema = z
  .object({
    username: z.string().min(1).max(30),
  });
