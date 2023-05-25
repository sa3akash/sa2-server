import { IUserDocument } from '@user/interfaces/user-interface';
import { UserModel } from '@user/models/User-model';
import mongoose from 'mongoose';

class UserService {
  public async addUserData(data: IUserDocument): Promise<void> {
    await UserModel.create(data);
  }

  public async getUserByAuthId(authId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' },
      { $project: this.aggregateProject() }
    ]);
    return users[0];
  }

  public async getUserById(userId: string): Promise<IUserDocument> {
    const user: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' },
      { $project: this.aggregateProject() }
    ]);
    return user[0];
  }

  private aggregateProject() {
    return {
      _id: 1,
      username: '$authData.username',
      uId: '$authData.uId',
      authId: '$authData._id',
      email: '$authData.email',
      avatarColor: '$authData.avatarColor',
      createdAt: '$authData.createdAt',
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      profilePicture: 1
    };
  }
}

export const userService: UserService = new UserService();
