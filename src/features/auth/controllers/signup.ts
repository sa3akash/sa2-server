import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { signupSchema } from '@auth/schemas/signup';
import { authService } from '@service/db/auth-services';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth-interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { Helpers } from '@global/helpers/helpers';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import HTTP_STATUS from 'http-status-codes';
import { config } from '@root/config';
import { IUserDocument } from '@user/interfaces/user-interface';
import { UserCache } from '@service/redis/user-cache';
import { authQueue } from '@service/queues/auth-queue';
import { userQueue } from '@service/queues/user-queue';
import jwt from 'jsonwebtoken';

const userCache: UserCache = new UserCache();

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    const checkIfUserExists: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);

    if (checkIfUserExists) {
      throw new BadRequestError('User already exists. Try to login!');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();

    const uId = `${Helpers.generateRandomIntegers(12)}`;

    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor
    });

    const path = `${config.FOLDFR}/${authObjectId}/profile-picture`;

    const result: UploadApiResponse = (await uploads(avatarImage, `${userObjectId}-profile-pic`, true, true, path)) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError('Image upload error. Try again later.');
    }

    // redis save data
    const userDataForCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId);
    userDataForCache.profilePicture = result.secure_url;

    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

    // add to database
    //omit(userDataForCache, ['uId', 'username', 'email', 'avatarColor', 'password']);

    authQueue.addAuthUserJob('addAuthUserToDB', { value: authData });
    userQueue.addUserJob('addUserUserToDB', { value: userDataForCache });

    // jsonwebtoken
    const token: string = SignUp.prototype.signToken(authData, userObjectId);
    req.session = { token };

    res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully.', user: userDataForCache, token });
  }

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return jwt.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_SEC!
    );
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUpperCase(username),
      email: Helpers.toLowerCase(email),
      password,
      avatarColor,
      createdAt: new Date()
    } as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUpperCase(username),
      email: Helpers.toLowerCase(email),
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument;
  }
}
