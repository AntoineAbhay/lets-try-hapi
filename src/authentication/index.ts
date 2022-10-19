import { Request, AuthCredentials as HapiAuthCredentials, UserCredentials as HapiUserCredentials } from '@hapi/hapi';
import Bcrypt from 'bcrypt';
import { UserDocument } from '../users/types';

interface AuthCredentials extends HapiAuthCredentials {
  user?: UserCredentials;
}

interface UserCredentials extends HapiUserCredentials {
  scopes: string[];
}

const validate = async (
  request: Request,
  username?: string,
  password?: string,
) => {
  if (!username) {
    return { credentials: null, isValid: false };
  }
  const usersCollection = request.getMongoCollection<UserDocument>('users');
  const user = await usersCollection.findOne({ username });
  if (!user) {
    return { credentials: null, isValid: false };
  }

  const isValid = await Bcrypt.compare(password || '', user.password);
  const credentials: AuthCredentials = { user: { scopes: user.scopes || [] }, scope: user.scopes };

  return { isValid, credentials };
};

export default validate;
