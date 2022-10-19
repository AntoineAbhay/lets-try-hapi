import { z } from 'zod';
import { UserInputSchema, UserResponseSchema } from './schema';

export type UserInput = z.infer<typeof UserInputSchema>;

export interface UserDocument {
  email: string;
  username: string;
  password: string;
  scopes?: string[];
}

export type UserResponse = z.infer<typeof UserResponseSchema>;
