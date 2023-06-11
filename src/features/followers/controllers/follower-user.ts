import { IFollowerData } from '@follower/interfaces/follower-interface';
import { FollowerCache } from '@service/redis/follower-cache';
import { UserCache } from '@service/redis/user-cache';
import { IUserDocument } from '@user/interfaces/user-interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { socketIOFollowerObject } from '@socket/follower-socket';
import { followerQueue } from '@service/queues/follower-queue';

const followerCache: FollowerCache = new FollowerCache();
const userCache: UserCache = new UserCache();

export class FollowerAdd {
  public async follower(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;

    // update count in cache
    const followerCount: Promise<void> = followerCache.updateFollowerCountCache(followerId, 'followersCount', 1);
    const followingCount: Promise<void> = followerCache.updateFollowerCountCache(`${req.currentUser?.userId}`, 'followingCount', 1);
    await Promise.all([followingCount, followerCount]);

    // add follower and following to cache
    const cachedFollower: Promise<IUserDocument> = userCache.getUserFromCache(followerId) as Promise<IUserDocument>;
    const cachedFollowee: Promise<IUserDocument> = userCache.getUserFromCache(`${req.currentUser?.userId}`) as Promise<IUserDocument>;
    const response: [IUserDocument, IUserDocument] = await Promise.all([cachedFollower, cachedFollowee]);

    // save databese
    const addFolloweeData: IFollowerData = FollowerAdd.prototype.userData(response[0]);
    socketIOFollowerObject.emit('add-follower', addFolloweeData);

    const addFollowerToCache: Promise<void> = followerCache.saveFollowerToCache(`following:${req.currentUser!.userId}`, `${followerId}`);
    const addFolloweeToCache: Promise<void> = followerCache.saveFollowerToCache(`followers:${followerId}`, `${req.currentUser!.userId}`);
    await Promise.all([addFollowerToCache, addFolloweeToCache]);

    // sand data to queue
    const followerObjectId: ObjectId = new ObjectId();

    followerQueue.addFollowerJob('addFollowerToDB', {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: `${followerId}`,
      username: req.currentUser!.username,
      followerDocumentId: followerObjectId
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Following user now.' });
  }

  private userData(user: IUserDocument): IFollowerData {
    return {
      _id: new mongoose.Types.ObjectId(user._id),
      username: user.username!,
      avatarColor: user.avatarColor!,
      postCount: user.postsCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      profilePicture: user.profilePicture,
      uId: user.uId!,
      userProfile: user
    };
  }
}
