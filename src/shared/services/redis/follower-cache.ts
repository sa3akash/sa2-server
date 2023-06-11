import { BaseCache } from '@service/redis/base-cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { IFollowerData } from '@follower/interfaces/follower-interface';
import { UserCache } from '@service/redis/user-cache';
import { IUserDocument } from '@user/interfaces/user-interface';
import mongoose from 'mongoose';
import { Helpers } from '@global/helpers/helpers';
import { findIndex, remove } from 'lodash';

const log: Logger = config.createLogger('follower-cache');
const userCache: UserCache = new UserCache();

export class FollowerCache extends BaseCache {
  constructor() {
    super('follower-cache');
  }

  /**
   *
   * save follower to cache
   *
   */
  public async saveFollowerToCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // await this.client.LPUSH(key, value);

      const followerList = await this.client.LRANGE(key, 0, -1);

      if (followerList.length === 0) {
        await this.client.LPUSH(key, value);
      } else {
        // if follower already exists
        const followerIndex: number = findIndex(followerList, (listItem: string) => listItem.includes(value));
        if (followerIndex < 0) {
          await this.client.LPUSH(key, value);
        }
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  /**
   *
   * remove follower to cache
   *
   */

  public async removeFollowerToCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.LREM(key, 1, value);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  /**
   *
   * update follower to cache
   *
   */
  public async updateFollowerCountCache(key: string, prop: string, value: number): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.HINCRBY(`users:${key}`, prop, value);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  /**
   *
   * get follower to cache
   *
   */
  public async getFollowerFromCache(key: string): Promise<IFollowerData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string[] = await this.client.LRANGE(key, 0, -1);
      const list: IFollowerData[] = [];

      for (const item of response) {
        const user: IUserDocument = (await userCache.getUserFromCache(item)) as IUserDocument;
        const data: IFollowerData = {
          _id: new mongoose.Types.ObjectId(user._id),
          uId: user.uId,
          username: user.username!,
          profilePicture: user.profilePicture,
          postCount: user.postsCount,
          avatarColor: user.avatarColor,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          userProfile: user
        } as IFollowerData;
        list.push(data);
      }

      return list;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  /**
   *
   * upadate follower to cache
   *
   */
  public async updateBlockedUserPropInCache(key: string, prop: string, value: string, type: 'block' | 'unblock'): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string = (await this.client.HGET(`users:${key}`, prop)) as string;

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      let blocked: string[] = Helpers.parseJson(response) as string[];

      if (type === 'block') {
        blocked = [...blocked, value];
      } else {
        remove(blocked, (id: string) => id === value);
        blocked = [...blocked];
      }

      multi.HSET(`users:${key}`, `${prop}`, JSON.stringify(blocked));
      await multi.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
