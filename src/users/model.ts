import Boom from '@hapi/boom';
import { Collection, MongoError } from 'mongodb';
import bcrypt from 'bcrypt';
import { UserDocument, UserInput, UserResponse } from './types';

export default class UserModel {
  readonly usersCollection: Collection<UserDocument>;

  constructor(collection: Collection<UserDocument>) {
    this.usersCollection = collection;
  }

  find = async (): Promise<UserResponse[]> => this.usersCollection
    .find<UserResponse>({}, { projection: { _id: 0, password: 0 } })
    .toArray();

  findOne = async ({
    username,
  }: {
    username: string;
  }): Promise<UserResponse | null> => this.usersCollection
    .findOne<UserResponse>({ username }, { projection: { _id: 0, password: 0 } });

  insertOne = async ({
    userInput,
  }: {
    userInput: UserInput;
  }): Promise<UserResponse> => {
    const { email, username, password } = userInput;
    const lowercaseEmail = email.toLowerCase();
    await this.usersCollection
      .insertOne({
        email: lowercaseEmail,
        username,
        password: await bcrypt.hash(password, 12),
        scopes: [],
      })
      .catch((e) => {
        if (e instanceof MongoError && e.code === 11000) {
          throw Boom.conflict('User already exists');
        }
        throw e;
      });
    return { email, username };
  };
}
