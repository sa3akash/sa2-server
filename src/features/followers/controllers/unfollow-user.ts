import { followerQueue } from '@service/queues/follower-queue';
import { FollowerCache } from '@service/redis/follower-cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const followerCache: FollowerCache = new FollowerCache();

export class RemoveFollower {
  public async unFollower(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;

    const removeFollowerFromCache: Promise<void> = followerCache.removeFollowerToCache(`following:${req.currentUser!.userId}`, followerId);
    const removeFolloweeFromCache: Promise<void> = followerCache.removeFollowerToCache(`followers:${followerId}`, req.currentUser!.userId);

    const followersCount: Promise<void> = followerCache.updateFollowerCountCache(`${followerId}`, 'followersCount', -1);
    const followeeCount: Promise<void> = followerCache.updateFollowerCountCache(`${req.currentUser!.userId}`, 'followingCount', -1);

    await Promise.all([removeFollowerFromCache, removeFolloweeFromCache, followersCount, followeeCount]);

    followerQueue.addFollowerJob('removeFollowerFromDB', {
      keyOne: `${followerId}`,
      keyTwo: `${req.currentUser!.userId}`
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Unfollowed user now' });
  }
}
