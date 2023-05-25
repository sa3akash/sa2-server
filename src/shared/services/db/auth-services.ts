import { IAuthDocument } from '@auth/interfaces/auth-interface';
import { AuthModel } from '@auth/models/auth-schema';
import { Helpers } from '@global/helpers/helpers';

class AuthService {
  public async getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: Helpers.firstLetterUpperCase(username) }, { email: Helpers.toLowerCase(email) }]
    };
    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }

  public async getAuthUserByUsername(username: string): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: Helpers.firstLetterUpperCase(username) }, { email: Helpers.toLowerCase(username) }]
    };
    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }

  public async createUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }
}

export const authService: AuthService = new AuthService();
