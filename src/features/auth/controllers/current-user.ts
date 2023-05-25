import { NotFoundError } from '@global/helpers/error-handler';
import { userService } from '@service/db/user-services';
import { UserCache } from '@service/redis/user-cache';
import { IUserDocument } from '@user/interfaces/user-interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const userCache: UserCache = new UserCache();

export class CurrentUser {
  public async get(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let token = null;
    let user = null;

    if (!req.currentUser) {
      throw new NotFoundError('User not found.');
    }

    const cacheUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser?.userId}`)) as IUserDocument;

    const userExist = cacheUser ? cacheUser : await userService.getUserById(`${req.currentUser?.userId}`);

    if (Object.keys(userExist).length) {
      isUser = true;
      token = req.session?.token;
      user = userExist;

      res.status(HTTP_STATUS.OK).json({ isUser, user, token });
    } else {
      throw new NotFoundError('User not found.');
    }
  }
}
