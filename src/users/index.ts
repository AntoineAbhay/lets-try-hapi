import { Plugin } from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';
import {
  GetUserParamsSchema,
  UserInputSchema,
  UserResponseSchema,
} from './schema';
import { UserDocument, UserInput, UserResponse } from './types';
import UserModel from './model';

const usersPlugin: Plugin<null> = {
  name: 'users',
  version: '0.0.1',
  register: (server) => {
    const usersCollection = server
      .getMongoCollection<UserDocument>('users');
    const userModel = new UserModel(usersCollection);

    server.route({
      method: 'GET',
      path: '/',
      handler: async (): Promise<UserResponse[]> => {
        const users = await userModel.find();
        return users;
      },
      options: {
        response: {
          modify: true,
          schema: async (payload) => z.array(UserResponseSchema).parse(payload),
        },
        auth: {
          access: {
            scope: ['+user_read'],
            entity: 'user',
          },
        },
      },
    });

    server.route({
      method: 'GET',
      path: '/{username}',
      handler: async (request): Promise<UserResponse> => {
        const { username } = request.params as z.infer<typeof GetUserParamsSchema>;
        const user = await userModel.findOne({ username });
        if (user) {
          return user;
        }
        throw Boom.notFound();
      },
      options: {
        validate: {
          params: async (payload) => GetUserParamsSchema.parse(payload),
        },
        response: {
          modify: true,
          schema: async (payload) => UserResponseSchema.parse(payload),
        },
        auth: {
          access: {
            scope: ['+user_read'],
            entity: 'user',
          },
        },
      },
    });

    server.route({
      method: 'POST',
      path: '/',
      handler: async (request): Promise<UserResponse> => {
        const userInput = request.payload as UserInput;
        const user = await userModel.insertOne({ userInput });
        return user;
      },
      options: {
        validate: {
          payload: async (payload) => UserInputSchema.parse(payload),
        },
        response: {
          modify: true,
          schema: async (payload) => UserResponseSchema.parse(payload),
        },
        auth: {
          access: {
            scope: ['+user_write'],
            entity: 'user',
          },
        },
      },
    });
  },
};

export default usersPlugin;
